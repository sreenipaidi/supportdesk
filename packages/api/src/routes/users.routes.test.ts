import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildApp } from '../app.js';
import { signToken } from '../lib/jwt.js';
import type { FastifyInstance } from 'fastify';

// Mock the user service module
vi.mock('../services/user.service.js', () => ({
  listUsers: vi.fn(),
  inviteUser: vi.fn(),
  activateUser: vi.fn(),
  getUser: vi.fn(),
  updateUser: vi.fn(),
}));

// Mock the database connection to avoid actual DB calls
vi.mock('../db/connection.js', () => ({
  getDb: vi.fn(),
}));

import * as userService from '../services/user.service.js';

describe('User routes', () => {
  let app: FastifyInstance;

  const adminToken = signToken(
    { sub: 'admin-123', tid: 'tenant-456', role: 'admin' },
    '8h',
  );
  const agentToken = signToken(
    { sub: 'agent-789', tid: 'tenant-456', role: 'agent' },
    '8h',
  );
  const clientToken = signToken(
    { sub: 'client-001', tid: 'tenant-456', role: 'client' },
    '24h',
  );

  beforeEach(async () => {
    vi.clearAllMocks();
    app = await buildApp();
  });

  describe('GET /v1/users', () => {
    it('should return 200 with user list for admin', async () => {
      vi.mocked(userService.listUsers).mockResolvedValue({
        data: [
          {
            id: 'user-1',
            email: 'agent@acme.com',
            full_name: 'Agent One',
            role: 'agent',
            is_active: true,
            email_verified: true,
            created_at: '2026-01-15T10:00:00Z',
          },
        ],
        pagination: {
          total: 1,
          page: 1,
          per_page: 25,
          total_pages: 1,
        },
      });

      const response = await app.inject({
        method: 'GET',
        url: '/v1/users',
        cookies: { session: adminToken },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data).toHaveLength(1);
      expect(body.pagination.total).toBe(1);
    });

    it('should return 403 for agent role', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/v1/users',
        cookies: { session: agentToken },
      });

      expect(response.statusCode).toBe(403);
    });

    it('should return 403 for client role', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/v1/users',
        cookies: { session: clientToken },
      });

      expect(response.statusCode).toBe(403);
    });

    it('should return 401 when not authenticated', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/v1/users',
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('POST /v1/users/invite', () => {
    it('should return 201 when admin invites a new user', async () => {
      vi.mocked(userService.inviteUser).mockResolvedValue({
        id: 'new-user-123',
        email: 'newagent@acme.com',
        full_name: 'New Agent',
        role: 'agent',
        is_active: false,
        email_verified: false,
        created_at: '2026-03-04T14:30:00Z',
      });

      const response = await app.inject({
        method: 'POST',
        url: '/v1/users/invite',
        cookies: { session: adminToken },
        payload: {
          email: 'newagent@acme.com',
          full_name: 'New Agent',
          role: 'agent',
        },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.id).toBe('new-user-123');
      expect(body.role).toBe('agent');
      expect(body.is_active).toBe(false);
    });

    it('should return 403 for non-admin', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/v1/users/invite',
        cookies: { session: agentToken },
        payload: {
          email: 'newagent@acme.com',
          full_name: 'New Agent',
          role: 'agent',
        },
      });

      expect(response.statusCode).toBe(403);
    });

    it('should return 422 when role is client (invalid for invite)', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/v1/users/invite',
        cookies: { session: adminToken },
        payload: {
          email: 'newclient@acme.com',
          full_name: 'New Client',
          role: 'client',
        },
      });

      expect(response.statusCode).toBe(422);
    });
  });

  describe('POST /v1/users/activate', () => {
    it('should return 200 on successful activation', async () => {
      vi.mocked(userService.activateUser).mockResolvedValue({
        message: 'Account activated successfully.',
      });

      const response = await app.inject({
        method: 'POST',
        url: '/v1/users/activate',
        payload: {
          token: 'valid-activation-token',
          password: 'securePassword123',
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.message).toContain('activated');
    });

    it('should return 422 when password is too short', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/v1/users/activate',
        payload: {
          token: 'valid-token',
          password: 'short',
        },
      });

      expect(response.statusCode).toBe(422);
    });
  });

  describe('GET /v1/users/:id', () => {
    it('should return user for admin viewing any user', async () => {
      vi.mocked(userService.getUser).mockResolvedValue({
        id: 'user-1',
        email: 'agent@acme.com',
        full_name: 'Agent One',
        role: 'agent',
        is_active: true,
        email_verified: true,
        created_at: '2026-01-15T10:00:00Z',
      });

      const response = await app.inject({
        method: 'GET',
        url: '/v1/users/user-1',
        cookies: { session: adminToken },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.id).toBe('user-1');
    });

    it('should return 403 when agent tries to view another user', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/v1/users/other-user-id',
        cookies: { session: agentToken },
      });

      expect(response.statusCode).toBe(403);
    });

    it('should allow agent to view their own profile', async () => {
      vi.mocked(userService.getUser).mockResolvedValue({
        id: 'agent-789',
        email: 'agent@acme.com',
        full_name: 'Agent',
        role: 'agent',
        is_active: true,
        email_verified: true,
        created_at: '2026-01-15T10:00:00Z',
      });

      const response = await app.inject({
        method: 'GET',
        url: '/v1/users/agent-789',
        cookies: { session: agentToken },
      });

      expect(response.statusCode).toBe(200);
    });
  });

  describe('PATCH /v1/users/:id', () => {
    it('should return 200 when admin updates a user', async () => {
      vi.mocked(userService.updateUser).mockResolvedValue({
        id: 'user-1',
        email: 'agent@acme.com',
        full_name: 'Updated Name',
        role: 'agent',
        is_active: true,
        email_verified: true,
        created_at: '2026-01-15T10:00:00Z',
      });

      const response = await app.inject({
        method: 'PATCH',
        url: '/v1/users/user-1',
        cookies: { session: adminToken },
        payload: {
          full_name: 'Updated Name',
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.full_name).toBe('Updated Name');
    });

    it('should return 401 when not authenticated', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: '/v1/users/user-1',
        payload: {
          full_name: 'Updated Name',
        },
      });

      expect(response.statusCode).toBe(401);
    });
  });
});
