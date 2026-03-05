import { getLogger } from '../lib/logger.js';
import {
  sendEmail,
  renderTicketCreatedEmail,
  renderAgentReplyEmail,
  renderTicketResolvedEmail,
  renderCsatSurveyEmail,
} from '../services/email.service.js';
import type { EmailJobData } from '../services/email.service.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Input for enqueuing a ticket_created email job. */
export interface TicketCreatedJobInput {
  type: 'ticket_created';
  to: string;
  ticketNumber: string;
  subject: string;
  tenantName: string;
  supportEmail: string;
  tenantId: string;
  ticketId: string;
}

/** Input for enqueuing an agent_reply email job. */
export interface AgentReplyJobInput {
  type: 'agent_reply';
  to: string;
  ticketNumber: string;
  subject: string;
  agentName: string;
  replyBody: string;
  tenantName: string;
  supportEmail: string;
  tenantId: string;
  ticketId: string;
}

/** Input for enqueuing a ticket_resolved email job. */
export interface TicketResolvedJobInput {
  type: 'ticket_resolved';
  to: string;
  ticketNumber: string;
  subject: string;
  tenantName: string;
  supportEmail: string;
  tenantId: string;
  ticketId: string;
}

/** Input for enqueuing a csat_survey email job. */
export interface CsatSurveyJobInput {
  type: 'csat_survey';
  to: string;
  ticketNumber: string;
  subject: string;
  surveyUrl: string;
  tenantName: string;
  supportEmail: string;
  tenantId: string;
  ticketId: string;
}

/** Union type for all email job inputs. */
export type EmailJobInput =
  | TicketCreatedJobInput
  | AgentReplyJobInput
  | TicketResolvedJobInput
  | CsatSurveyJobInput;

// ---------------------------------------------------------------------------
// Job Processing
// ---------------------------------------------------------------------------

/**
 * Process an email job by rendering the appropriate template and sending
 * the email.
 *
 * This is the core handler for the BullMQ email worker. Each job type
 * uses a specific template to render the email content, then calls
 * sendEmail() to deliver it.
 *
 * In the current stub implementation, sendEmail logs instead of sending.
 */
export async function processEmailJob(job: EmailJobInput): Promise<void> {
  const logger = getLogger();

  logger.info(
    { type: job.type, to: job.to, ticketNumber: job.ticketNumber },
    'Processing email job',
  );

  let rendered: { subject: string; html: string };

  switch (job.type) {
    case 'ticket_created':
      rendered = renderTicketCreatedEmail({
        ticketNumber: job.ticketNumber,
        subject: job.subject,
        tenantName: job.tenantName,
        supportEmail: job.supportEmail,
      });
      break;

    case 'agent_reply':
      rendered = renderAgentReplyEmail({
        ticketNumber: job.ticketNumber,
        subject: job.subject,
        agentName: job.agentName,
        replyBody: job.replyBody,
        tenantName: job.tenantName,
        supportEmail: job.supportEmail,
      });
      break;

    case 'ticket_resolved':
      rendered = renderTicketResolvedEmail({
        ticketNumber: job.ticketNumber,
        subject: job.subject,
        tenantName: job.tenantName,
        supportEmail: job.supportEmail,
      });
      break;

    case 'csat_survey':
      rendered = renderCsatSurveyEmail({
        ticketNumber: job.ticketNumber,
        subject: job.subject,
        surveyUrl: job.surveyUrl,
        tenantName: job.tenantName,
        supportEmail: job.supportEmail,
      });
      break;

    default: {
      // Exhaustive check: ensure all job types are handled
      const unknownJob: never = job;
      throw new Error(`Unknown email job type: ${(unknownJob as EmailJobInput).type}`);
    }
  }

  await sendEmail(job.to, rendered.subject, rendered.html);

  logger.info(
    { type: job.type, to: job.to, subject: rendered.subject },
    'Email job processed successfully',
  );
}

// ---------------------------------------------------------------------------
// Queue Helpers
// ---------------------------------------------------------------------------

/** The name of the BullMQ email queue. */
export const EMAIL_QUEUE_NAME = 'email';

/**
 * Build the email job data from an EmailJobInput for adding to the queue.
 * This transforms the input into the shape needed for the queue.
 */
export function buildEmailJobData(input: EmailJobInput): EmailJobData {
  let rendered: { subject: string; html: string };

  switch (input.type) {
    case 'ticket_created':
      rendered = renderTicketCreatedEmail({
        ticketNumber: input.ticketNumber,
        subject: input.subject,
        tenantName: input.tenantName,
        supportEmail: input.supportEmail,
      });
      break;

    case 'agent_reply':
      rendered = renderAgentReplyEmail({
        ticketNumber: input.ticketNumber,
        subject: input.subject,
        agentName: input.agentName,
        replyBody: input.replyBody,
        tenantName: input.tenantName,
        supportEmail: input.supportEmail,
      });
      break;

    case 'ticket_resolved':
      rendered = renderTicketResolvedEmail({
        ticketNumber: input.ticketNumber,
        subject: input.subject,
        tenantName: input.tenantName,
        supportEmail: input.supportEmail,
      });
      break;

    case 'csat_survey':
      rendered = renderCsatSurveyEmail({
        ticketNumber: input.ticketNumber,
        subject: input.subject,
        surveyUrl: input.surveyUrl,
        tenantName: input.tenantName,
        supportEmail: input.supportEmail,
      });
      break;
  }

  return {
    type: input.type,
    to: input.to,
    subject: rendered.subject,
    html: rendered.html,
    tenantId: input.tenantId,
    ticketId: input.ticketId,
    ticketNumber: input.ticketNumber,
  };
}

/**
 * Create and start the BullMQ email worker.
 * Listens on the "email" queue and processes jobs using processEmailJob().
 *
 * TODO: In production, import BullMQ Worker and connect to Redis:
 *
 * ```typescript
 * import { Worker } from 'bullmq';
 * import { getConfig } from '../config.js';
 *
 * const config = getConfig();
 * const worker = new Worker(EMAIL_QUEUE_NAME, async (job) => {
 *   await processEmailJob(job.data as EmailJobInput);
 * }, {
 *   connection: { url: config.REDIS_URL },
 *   concurrency: 5,
 * });
 * ```
 */
export function startEmailWorker(): { close: () => Promise<void> } {
  const logger = getLogger();
  logger.info('Email worker started (stub -- no BullMQ connection)');

  // Stub: return a mock worker handle
  return {
    close: async () => {
      logger.info('Email worker stopped');
    },
  };
}
