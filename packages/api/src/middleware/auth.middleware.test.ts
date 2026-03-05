import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authenticate } from './auth.middleware.js';
import { signToken } from '../lib/jwt.js';
import type { FastifyRequest, FastifyReply } from 'fastify';

describe('authenticate middleware', () => {
  const mockReply = {} as FastifyReply;

  function createMockRequest(cookies: Record<string, string> = {}): FastifyRequest {
    return {
      cookies,
      log: {
        error: vi.fn(),
        warn: vi.fn(),
        info: vi.fn(),
      },
    } as unknown as FastifyRequest;
  }

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should attach user to request when valid token is present', async () => {
    const token = signToken(
      {
        sub: 'user-123',
        tid: 'tenant-456',
        role: 'agent',
      },
      '8h',
    );

    const request = createMockRequest({ session: token });
    await authenticate(request, mockReply);

    expect(request.user).toBeDefined();
    expect(request.user!.id).toBe('user-123');
    expect(request.user!.tenantId).toBe('tenant-456');
    expect(request.user!.role).toBe('agent');
  });

  it('should throw 401 when no token is present', async () => {
    const request = createMockRequest({});

    await expect(authenticate(request, mockReply)).rejects.toThrow(
      'Authentication required',
    );
  });

  it('should throw 401 when token is invalid', async () => {
    const request = createMockRequest({ session: 'invalid-token' });

    await expect(authenticate(request, mockReply)).rejects.toThrow(
      'Invalid or expired token',
    );
  });
});
