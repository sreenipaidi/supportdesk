import type { FastifyRequest, FastifyReply } from 'fastify';
import { AuthenticationError } from '../lib/errors.js';

// Extend FastifyRequest to include tenantId
declare module 'fastify' {
  interface FastifyRequest {
    tenantId?: string;
  }
}

/**
 * Fastify preHandler hook that extracts tenant_id from the authenticated user context
 * and makes it available at `request.tenantId` for all downstream handlers and queries.
 * Must run after the authenticate middleware.
 */
export async function tenantScope(
  request: FastifyRequest,
  _reply: FastifyReply,
): Promise<void> {
  if (!request.user) {
    throw new AuthenticationError('Authentication required');
  }

  request.tenantId = request.user.tenantId;
}
