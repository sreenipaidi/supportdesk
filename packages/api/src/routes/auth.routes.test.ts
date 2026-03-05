import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildApp } from '../app.js';
import type { FastifyInstance } from 'fastify';

// Mock the auth service module
vi.mock('../services/auth.service.js', () => ({
  login: vi.fn(),
  register: vi.fn(),
  forgotPassword: vi.fn(),
  resetPassword: vi.fn(),
  getCurrentUser: vi.fn(),
  createTenant: vi.fn(),
}));

// Mock the database connection to avoid actual DB calls
vi.mock('../db/connection.js', () => ({
  getDb: vi.fn(),
}));

import * as authService from '../services/auth.service.js';

describe('Auth routes', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    vi.clearAllMocks();
    app = await buildApp();
  });

  describe('POST /v1/auth/login', () => {
    it('should return 200 and set session cookie on successful login', async () => {
      const mockResult = {
        user: {
          id: 'user-123',
          email: 'agent@acme.com',
          full_name: 'Agent Smith',
          role: 'agent' as const,
          is_active: true,
          email_verified: true,
          created_at: '2026-01-15T10:00:00Z',
        },
        tenant: {
          id: 'tenant-456',
          name: 'Acme Corp',
          subdomain: 'acme',
        },
        token: 'mock-jwt-token',
        expiresAt: '2026-03-04T22:30:00Z',
      };

      vi.mocked(authService.login).mockResolvedValue(mockResult);

      const response = await app.inject({
        method: 'POST',
        url: '/v1/auth/login',
        payload: {
          email: 'agent@acme.com',
          password: 'securePassword',
          portal: 'acme',
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.user.id).toBe('user-123');
      expect(body.user.email).toBe('agent@acme.com');
      expect(body.tenant.subdomain).toBe('acme');
      expect(body.expires_at).toBeDefined();

      // Check session cookie is set
      const setCookie = response.headers['set-cookie'];
      expect(setCookie).toBeDefined();
      expect(String(setCookie)).toContain('session=');
      expect(String(setCookie)).toContain('HttpOnly');
    });

    it('should return 422 when email is invalid', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/v1/auth/login',
        payload: {
          email: 'not-an-email',
          password: 'securePassword',
          portal: 'acme',
        },
      });

      expect(response.statusCode).toBe(422);
      const body = JSON.parse(response.body);
      expect(body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 422 when password is too short', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/v1/auth/login',
        payload: {
          email: 'user@example.com',
          password: 'short',
          portal: 'acme',
        },
      });

      expect(response.statusCode).toBe(422);
    });

    it('should return 422 when portal is missing', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/v1/auth/login',
        payload: {
          email: 'user@example.com',
          password: 'securePassword',
        },
      });

      expect(response.statusCode).toBe(422);
    });
  });

  describe('POST /v1/auth/register', () => {
    it('should return 201 on successful registration', async () => {
      vi.mocked(authService.register).mockResolvedValue({
        userId: 'new-user-123',
        message: 'Registration successful. Please check your email to verify your account.',
      });

      const response = await app.inject({
        method: 'POST',
        url: '/v1/auth/register',
        payload: {
          email: 'client@company.com',
          full_name: 'New Client',
          password: 'securePassword123',
          portal: 'acme',
        },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.user_id).toBe('new-user-123');
      expect(body.message).toContain('Registration successful');
    });

    it('should return 422 when full_name is missing', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/v1/auth/register',
        payload: {
          email: 'client@company.com',
          password: 'securePassword123',
          portal: 'acme',
        },
      });

      expect(response.statusCode).toBe(422);
    });
  });

  describe('POST /v1/auth/logout', () => {
    it('should return 401 when not authenticated', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/v1/auth/logout',
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('POST /v1/auth/forgot-password', () => {
    it('should return 200 regardless of whether email exists', async () => {
      vi.mocked(authService.forgotPassword).mockResolvedValue({
        message: 'If an account exists with this email, a password reset link has been sent.',
      });

      const response = await app.inject({
        method: 'POST',
        url: '/v1/auth/forgot-password',
        payload: {
          email: 'unknown@example.com',
          portal: 'acme',
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.message).toContain('password reset link');
    });
  });

  describe('POST /v1/auth/reset-password', () => {
    it('should return 200 on successful password reset', async () => {
      vi.mocked(authService.resetPassword).mockResolvedValue({
        message: 'Password reset successfully. Please log in with your new password.',
      });

      const response = await app.inject({
        method: 'POST',
        url: '/v1/auth/reset-password',
        payload: {
          token: 'valid-reset-token',
          password: 'newSecurePassword123',
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.message).toContain('Password reset successfully');
    });

    it('should return 422 when password is too short', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/v1/auth/reset-password',
        payload: {
          token: 'valid-token',
          password: 'short',
        },
      });

      expect(response.statusCode).toBe(422);
    });
  });

  describe('GET /v1/auth/me', () => {
    it('should return 401 when not authenticated', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/v1/auth/me',
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('POST /v1/tenants', () => {
    it('should return 201 on successful tenant creation', async () => {
      const mockResult = {
        user: {
          id: 'admin-123',
          email: 'admin@acme.com',
          full_name: 'Sarah Johnson',
          role: 'admin' as const,
          is_active: true,
          email_verified: true,
          created_at: '2026-03-04T14:30:00Z',
        },
        tenant: {
          id: 'tenant-789',
          name: 'Acme Corp',
          subdomain: 'acme',
        },
        token: 'mock-jwt-token',
        expiresAt: '2026-03-04T22:30:00Z',
      };

      vi.mocked(authService.createTenant).mockResolvedValue(mockResult);

      const response = await app.inject({
        method: 'POST',
        url: '/v1/tenants',
        payload: {
          company_name: 'Acme Corp',
          subdomain: 'acme',
          admin_email: 'admin@acme.com',
          admin_full_name: 'Sarah Johnson',
          admin_password: 'securePassword123',
        },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.tenant.subdomain).toBe('acme');
      expect(body.user.role).toBe('admin');
      expect(body.tenant.support_email).toBe('support@acme.helpdesk.com');

      // Check session cookie is set
      const setCookie = response.headers['set-cookie'];
      expect(setCookie).toBeDefined();
    });

    it('should return 422 when subdomain format is invalid', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/v1/tenants',
        payload: {
          company_name: 'Acme Corp',
          subdomain: 'INVALID SUBDOMAIN!!',
          admin_email: 'admin@acme.com',
          admin_full_name: 'Sarah Johnson',
          admin_password: 'securePassword123',
        },
      });

      expect(response.statusCode).toBe(422);
    });
  });
});
