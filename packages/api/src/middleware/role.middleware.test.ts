import { describe, it, expect } from 'vitest';
import { requireRole } from './role.middleware.js';
import type { FastifyRequest, FastifyReply } from 'fastify';
import type { RequestUser } from './auth.middleware.js';

describe('requireRole middleware', () => {
  const mockReply = {} as FastifyReply;

  function createMockRequest(user?: RequestUser): FastifyRequest {
    return {
      user,
    } as unknown as FastifyRequest;
  }

  it('should pass when user role is in the allowed list', async () => {
    const handler = requireRole('admin', 'agent');
    const request = createMockRequest({
      id: 'user-1',
      tenantId: 'tenant-1',
      role: 'agent',
    });

    await expect(handler(request, mockReply)).resolves.toBeUndefined();
  });

  it('should throw 401 when user is not authenticated', async () => {
    const handler = requireRole('admin');
    const request = createMockRequest(undefined);

    await expect(handler(request, mockReply)).rejects.toThrow(
      'Authentication required',
    );
  });

  it('should throw 403 when user role is not in the allowed list', async () => {
    const handler = requireRole('admin');
    const request = createMockRequest({
      id: 'user-1',
      tenantId: 'tenant-1',
      role: 'client',
    });

    await expect(handler(request, mockReply)).rejects.toThrow(
      'Insufficient permissions',
    );
  });

  it('should pass for admin when admin is the only allowed role', async () => {
    const handler = requireRole('admin');
    const request = createMockRequest({
      id: 'user-1',
      tenantId: 'tenant-1',
      role: 'admin',
    });

    await expect(handler(request, mockReply)).resolves.toBeUndefined();
  });

  it('should pass for client when client is allowed', async () => {
    const handler = requireRole('admin', 'agent', 'client');
    const request = createMockRequest({
      id: 'user-1',
      tenantId: 'tenant-1',
      role: 'client',
    });

    await expect(handler(request, mockReply)).resolves.toBeUndefined();
  });
});
