import { describe, it, expect } from 'vitest';
import { tenantScope } from './tenant.middleware.js';
import type { FastifyRequest, FastifyReply } from 'fastify';
import type { RequestUser } from './auth.middleware.js';

describe('tenantScope middleware', () => {
  const mockReply = {} as FastifyReply;

  function createMockRequest(user?: RequestUser): FastifyRequest {
    return {
      user,
    } as unknown as FastifyRequest;
  }

  it('should set tenantId from authenticated user', async () => {
    const request = createMockRequest({
      id: 'user-1',
      tenantId: 'tenant-123',
      role: 'agent',
    });

    await tenantScope(request, mockReply);

    expect(request.tenantId).toBe('tenant-123');
  });

  it('should throw 401 when user is not authenticated', async () => {
    const request = createMockRequest(undefined);

    await expect(tenantScope(request, mockReply)).rejects.toThrow(
      'Authentication required',
    );
  });
});
