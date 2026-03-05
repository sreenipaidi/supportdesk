import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildApp } from '../app.js';
import type { FastifyInstance } from 'fastify';
import { AppError, NotFoundError, ValidationError } from '../lib/errors.js';

// Mock the database connection
vi.mock('../db/connection.js', () => ({
  getDb: vi.fn(),
}));

describe('Error handler middleware', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    vi.clearAllMocks();
    app = await buildApp();
  });

  it('should handle AppError with correct status code and format', async () => {
    // Register a test route that throws
    app.get('/test/app-error', async () => {
      throw new AppError(403, 'ACCOUNT_DEACTIVATED', 'Your account is deactivated.');
    });

    const response = await app.inject({
      method: 'GET',
      url: '/test/app-error',
    });

    expect(response.statusCode).toBe(403);
    const body = JSON.parse(response.body);
    expect(body.error.code).toBe('ACCOUNT_DEACTIVATED');
    expect(body.error.message).toBe('Your account is deactivated.');
    expect(body.error.request_id).toBeDefined();
  });

  it('should handle NotFoundError', async () => {
    app.get('/test/not-found', async () => {
      throw new NotFoundError('Ticket');
    });

    const response = await app.inject({
      method: 'GET',
      url: '/test/not-found',
    });

    expect(response.statusCode).toBe(404);
    const body = JSON.parse(response.body);
    expect(body.error.code).toBe('NOT_FOUND');
    expect(body.error.message).toBe('Ticket not found');
  });

  it('should handle ValidationError with field details', async () => {
    app.get('/test/validation-error', async () => {
      throw new ValidationError('Validation failed', [
        { field: 'email', message: 'Invalid email', code: 'invalid_string' },
      ]);
    });

    const response = await app.inject({
      method: 'GET',
      url: '/test/validation-error',
    });

    expect(response.statusCode).toBe(422);
    const body = JSON.parse(response.body);
    expect(body.error.code).toBe('VALIDATION_ERROR');
    expect(body.error.details).toHaveLength(1);
    expect(body.error.details[0].field).toBe('email');
  });

  it('should handle unexpected errors with 500', async () => {
    app.get('/test/unexpected', async () => {
      throw new Error('Something broke');
    });

    const response = await app.inject({
      method: 'GET',
      url: '/test/unexpected',
    });

    expect(response.statusCode).toBe(500);
    const body = JSON.parse(response.body);
    expect(body.error.code).toBe('INTERNAL_ERROR');
    expect(body.error.message).toBe('An unexpected error occurred');
  });
});
