import { describe, it, expect, vi } from 'vitest';
import { AppError, AuthenticationError, ConflictError, NotFoundError } from '../lib/errors.js';

// Mock the database connection so that imports don't break
vi.mock('../db/connection.js', () => ({
  getDb: vi.fn(() => ({
    select: () => ({
      from: () => ({
        where: () => ({
          limit: () => Promise.resolve([]),
        }),
      }),
    }),
    insert: () => ({
      values: () => ({
        returning: () => Promise.resolve([]),
      }),
    }),
    update: () => ({
      set: () => ({
        where: () => Promise.resolve(),
      }),
    }),
  })),
}));

// We test the pure/logic parts of auth service rather than DB interactions
// since those require a real database. The route tests above cover the
// full endpoint integration with mocked services.

import { hashPassword, comparePassword } from '../lib/password.js';
import { signToken, verifyToken } from '../lib/jwt.js';

describe('Auth service - unit logic', () => {
  describe('password hashing', () => {
    it('should hash and verify a password correctly', async () => {
      const password = 'TestPassword123!';
      const hash = await hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);

      const isValid = await comparePassword(password, hash);
      expect(isValid).toBe(true);
    });

    it('should reject an incorrect password', async () => {
      const hash = await hashPassword('CorrectPassword');
      const isValid = await comparePassword('WrongPassword', hash);
      expect(isValid).toBe(false);
    });
  });

  describe('JWT token generation', () => {
    it('should generate a valid JWT with correct claims', () => {
      const payload = {
        sub: 'user-123',
        tid: 'tenant-456',
        role: 'admin' as const,
      };

      const token = signToken(payload, '8h');
      const decoded = verifyToken(token);

      expect(decoded.sub).toBe('user-123');
      expect(decoded.tid).toBe('tenant-456');
      expect(decoded.role).toBe('admin');
      expect(decoded.exp).toBeGreaterThan(decoded.iat);
    });

    it('should use different expiry for different durations', () => {
      const payload = {
        sub: 'user-123',
        tid: 'tenant-456',
        role: 'client' as const,
      };

      const shortToken = signToken(payload, '1h');
      const longToken = signToken(payload, '24h');

      const shortDecoded = verifyToken(shortToken);
      const longDecoded = verifyToken(longToken);

      // 24h token should expire later than 1h token
      expect(longDecoded.exp).toBeGreaterThan(shortDecoded.exp);
    });
  });

  describe('error classes', () => {
    it('should create AuthenticationError with 401', () => {
      const error = new AuthenticationError('Invalid credentials');
      expect(error.statusCode).toBe(401);
      expect(error.code).toBe('UNAUTHORIZED');
      expect(error.message).toBe('Invalid credentials');
    });

    it('should create ConflictError with 409', () => {
      const error = new ConflictError('Email already exists');
      expect(error.statusCode).toBe(409);
      expect(error.code).toBe('CONFLICT');
    });

    it('should create NotFoundError with 404', () => {
      const error = new NotFoundError('User');
      expect(error.statusCode).toBe(404);
      expect(error.message).toBe('User not found');
    });

    it('should create AppError with custom code', () => {
      const error = new AppError(403, 'ACCOUNT_LOCKED', 'Account is locked');
      expect(error.statusCode).toBe(403);
      expect(error.code).toBe('ACCOUNT_LOCKED');
    });
  });
});
