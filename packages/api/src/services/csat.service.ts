import { eq, and } from 'drizzle-orm';
import { randomBytes } from 'crypto';
import { getDb } from '../db/connection.js';
import { csatResponses, tickets, users, tenants } from '../db/schema.js';
import { getLogger } from '../lib/logger.js';
import { AppError, NotFoundError, ConflictError } from '../lib/errors.js';

/** Survey metadata returned for the public survey page. */
export interface SurveyData {
  ticket_number: string;
  subject: string;
  agent_name: string;
  tenant_name: string;
  logo_url: string | null;
  brand_color: string;
  already_submitted: boolean;
}

/** Successful submission response. */
export interface SubmitSurveyResult {
  message: string;
}

/**
 * Generate a cryptographically random URL-safe token for CSAT surveys.
 */
function generateToken(): string {
  return randomBytes(32).toString('hex');
}

/**
 * Create a CSAT survey record for a resolved ticket.
 *
 * This is called automatically when a ticket transitions to the "resolved" status.
 * Generates a unique token and stubs the email notification (logging it for now).
 *
 * @param tenantId - The tenant ID
 * @param ticketId - The ticket ID that was resolved
 * @returns The generated survey token
 */
export async function createSurvey(
  tenantId: string,
  ticketId: string,
): Promise<string> {
  const db = getDb();
  const logger = getLogger();

  // Check if a survey already exists for this ticket
  const [existing] = await db
    .select({ id: csatResponses.id })
    .from(csatResponses)
    .where(eq(csatResponses.ticketId, ticketId))
    .limit(1);

  if (existing) {
    logger.info({ tenantId, ticketId }, 'CSAT survey already exists for ticket, skipping creation');
    return '';
  }

  const token = generateToken();

  await db.insert(csatResponses).values({
    ticketId,
    tenantId,
    token,
  });

  // Stub email sending - log the survey URL
  const surveyUrl = `/survey/${token}`;
  logger.info(
    { tenantId, ticketId, surveyUrl },
    'CSAT survey created. Email stub: would send survey link to client.',
  );

  return token;
}

/**
 * Retrieve survey metadata for the public survey page.
 *
 * This is accessed via a unique token embedded in the survey URL.
 * No authentication is required.
 */
export async function getSurvey(token: string): Promise<SurveyData> {
  const db = getDb();
  const logger = getLogger();

  // Find the CSAT response by token
  const [csatRow] = await db
    .select({
      id: csatResponses.id,
      ticketId: csatResponses.ticketId,
      tenantId: csatResponses.tenantId,
      respondedAt: csatResponses.respondedAt,
    })
    .from(csatResponses)
    .where(eq(csatResponses.token, token))
    .limit(1);

  if (!csatRow) {
    logger.warn({ token: token.slice(0, 8) }, 'Invalid CSAT survey token');
    throw new AppError(400, 'INVALID_TOKEN', 'This survey link is invalid or has expired.');
  }

  // Get ticket details
  const [ticket] = await db
    .select({
      ticketNumber: tickets.ticketNumber,
      subject: tickets.subject,
      assignedAgentId: tickets.assignedAgentId,
    })
    .from(tickets)
    .where(eq(tickets.id, csatRow.ticketId))
    .limit(1);

  if (!ticket) {
    logger.error({ ticketId: csatRow.ticketId }, 'CSAT survey references non-existent ticket');
    throw new NotFoundError('Ticket');
  }

  // Get agent name
  let agentName = 'Support Team';
  if (ticket.assignedAgentId) {
    const [agent] = await db
      .select({ fullName: users.fullName })
      .from(users)
      .where(eq(users.id, ticket.assignedAgentId))
      .limit(1);
    if (agent) {
      agentName = agent.fullName;
    }
  }

  // Get tenant branding
  const [tenant] = await db
    .select({
      name: tenants.name,
      logoUrl: tenants.logoUrl,
      brandColor: tenants.brandColor,
    })
    .from(tenants)
    .where(eq(tenants.id, csatRow.tenantId))
    .limit(1);

  if (!tenant) {
    logger.error({ tenantId: csatRow.tenantId }, 'CSAT survey references non-existent tenant');
    throw new AppError(500, 'INTERNAL_ERROR', 'An unexpected error occurred');
  }

  return {
    ticket_number: ticket.ticketNumber,
    subject: ticket.subject,
    agent_name: agentName,
    tenant_name: tenant.name,
    logo_url: tenant.logoUrl ?? null,
    brand_color: tenant.brandColor ?? '#2563EB',
    already_submitted: csatRow.respondedAt !== null,
  };
}

/**
 * Submit a CSAT survey response (rating and optional comment).
 *
 * This is accessed via a unique token. No authentication required.
 * Returns an error if the survey was already submitted.
 */
export async function submitSurvey(
  token: string,
  rating: number,
  comment?: string,
): Promise<SubmitSurveyResult> {
  const db = getDb();
  const logger = getLogger();

  // Find the CSAT response by token
  const [csatRow] = await db
    .select({
      id: csatResponses.id,
      ticketId: csatResponses.ticketId,
      tenantId: csatResponses.tenantId,
      respondedAt: csatResponses.respondedAt,
    })
    .from(csatResponses)
    .where(eq(csatResponses.token, token))
    .limit(1);

  if (!csatRow) {
    logger.warn({ token: token.slice(0, 8) }, 'Invalid CSAT survey token on submit');
    throw new AppError(400, 'INVALID_TOKEN', 'This survey link is invalid or has expired.');
  }

  if (csatRow.respondedAt !== null) {
    throw new ConflictError('This survey has already been submitted.');
  }

  // Update the CSAT response
  await db
    .update(csatResponses)
    .set({
      rating,
      comment: comment ?? null,
      respondedAt: new Date(),
    })
    .where(
      and(
        eq(csatResponses.id, csatRow.id),
        eq(csatResponses.token, token),
      ),
    );

  logger.info(
    { ticketId: csatRow.ticketId, tenantId: csatRow.tenantId, rating },
    'CSAT survey response submitted',
  );

  return { message: 'Thank you for your feedback!' };
}
