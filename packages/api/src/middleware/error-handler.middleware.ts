import type { FastifyInstance, FastifyError } from 'fastify';
import { AppError } from '../lib/errors.js';
import { ZodError } from 'zod';

/**
 * Register the global error handler for the Fastify application.
 * Converts AppError subclasses and ZodErrors into structured JSON responses
 * following the API contract's ErrorResponse format.
 */
export function registerErrorHandler(app: FastifyInstance): void {
  app.setErrorHandler((error: FastifyError | AppError | ZodError | Error, request, reply) => {
    const requestId = (request.id as string) ?? 'unknown';

    // Handle AppError subclasses (our application-level errors)
    if (error instanceof AppError) {
      if (error.statusCode >= 500) {
        request.log.error({ err: error, requestId }, error.message);
      } else {
        request.log.warn({ err: error, requestId }, error.message);
      }

      return reply.status(error.statusCode).send({
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
          request_id: requestId,
        },
      });
    }

    // Handle Zod validation errors
    if (error instanceof ZodError) {
      const details = error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
        code: e.code,
      }));

      request.log.warn({ err: error, requestId }, 'Validation error');

      return reply.status(422).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Request validation failed',
          details,
          request_id: requestId,
        },
      });
    }

    // Handle Fastify native validation errors (e.g., from JSON schema)
    const fastifyErr = error as FastifyError;
    if (fastifyErr.validation) {
      request.log.warn({ err: error, requestId }, 'Fastify validation error');

      return reply.status(400).send({
        error: {
          code: 'BAD_REQUEST',
          message: fastifyErr.message,
          request_id: requestId,
        },
      });
    }

    // Unexpected errors - log full stack and return 500
    request.log.error({ err: error, requestId }, 'Unexpected error');

    return reply.status(500).send({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
        request_id: requestId,
      },
    });
  });
}
