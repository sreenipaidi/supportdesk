import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import {
  parseInboundEmail,
  processInboundEmail,
} from '../services/email.service.js';
import type { SendGridInboundPayload } from '../services/email.service.js';
import { getLogger } from '../lib/logger.js';

/**
 * Zod schema for basic validation of the SendGrid Inbound Parse payload.
 * SendGrid sends form-encoded data with these fields.
 */
const inboundEmailSchema = z.object({
  from: z.string().min(1, 'from is required'),
  to: z.string().min(1, 'to is required'),
  subject: z.string().optional().default(''),
  text: z.string().optional().default(''),
  html: z.string().optional().default(''),
  headers: z.string().optional().default(''),
  envelope: z.string().optional().default(''),
  attachments: z.string().optional().default('0'),
  'attachment-info': z.string().optional(),
});

/**
 * Stub for SendGrid webhook signature verification.
 * In production, this should verify the X-Twilio-Email-Event-Webhook-Signature
 * header against the webhook signing key.
 *
 * TODO: Implement proper signature verification using the SendGrid event webhook
 * verification library or manual ECDSA verification.
 */
function verifyWebhookSignature(
  _signature: string | undefined,
  _timestamp: string | undefined,
  _body: string,
): boolean {
  const logger = getLogger();
  logger.warn('Webhook signature verification is stubbed -- accepting all requests');
  return true;
}

/**
 * Register webhook routes. These routes do NOT require authentication
 * because they are called by external services (e.g., SendGrid).
 */
export async function webhookRoutes(app: FastifyInstance): Promise<void> {
  /**
   * POST /v1/webhooks/inbound-email
   *
   * Receives inbound email from SendGrid Inbound Parse.
   * This endpoint is unauthenticated -- it is secured by webhook signature verification.
   *
   * Flow:
   * 1. Verify webhook signature (stubbed for now)
   * 2. Parse the email payload
   * 3. Determine tenant from the "to" address
   * 4. If reply to existing ticket: add as client reply
   * 5. If new email: create ticket, find/create client
   */
  app.post(
    '/webhooks/inbound-email',
    async (request, reply) => {
      const logger = getLogger();
      const requestId = request.id as string;

      try {
        // Verify webhook signature (stub)
        const signature = request.headers['x-twilio-email-event-webhook-signature'] as
          | string
          | undefined;
        const timestamp = request.headers['x-twilio-email-event-webhook-timestamp'] as
          | string
          | undefined;

        if (!verifyWebhookSignature(signature, timestamp, JSON.stringify(request.body))) {
          logger.warn({ requestId }, 'Webhook signature verification failed');
          return reply.status(401).send({
            error: {
              code: 'UNAUTHORIZED',
              message: 'Invalid webhook signature',
              request_id: requestId,
            },
          });
        }

        // Validate the payload
        const validationResult = inboundEmailSchema.safeParse(request.body);
        if (!validationResult.success) {
          logger.warn(
            { requestId, errors: validationResult.error.errors },
            'Invalid inbound email payload',
          );
          return reply.status(422).send({
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Invalid inbound email payload',
              details: validationResult.error.errors.map((e) => ({
                field: e.path.join('.'),
                message: e.message,
                code: e.code,
              })),
              request_id: requestId,
            },
          });
        }

        const payload = validationResult.data as SendGridInboundPayload;

        // Parse the email
        const parsed = parseInboundEmail(payload);

        // Process the email (create/reply ticket)
        const result = await processInboundEmail(parsed);

        logger.info(
          {
            requestId,
            action: result.action,
            ticketId: result.ticketId,
            ticketNumber: result.ticketNumber,
            tenantId: result.tenantId,
          },
          'Inbound email processed successfully',
        );

        return reply.status(200).send({ message: 'Processed.' });
      } catch (err) {
        // For 404 (tenant not found), return 200 to SendGrid to avoid retries
        // but log the issue
        if (err instanceof Error && err.message.includes('not found')) {
          logger.warn(
            { requestId, err },
            'Inbound email could not be processed -- tenant or resource not found',
          );
          return reply.status(200).send({ message: 'Processed.' });
        }

        logger.error({ requestId, err }, 'Failed to process inbound email');
        return reply.status(500).send({
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to process inbound email',
            request_id: requestId,
          },
        });
      }
    },
  );
}
