import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('../lib/logger.js', () => ({
  getLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}));

vi.mock('../services/email.service.js', () => ({
  sendEmail: vi.fn(),
  renderTicketCreatedEmail: vi.fn(),
  renderAgentReplyEmail: vi.fn(),
  renderTicketResolvedEmail: vi.fn(),
  renderCsatSurveyEmail: vi.fn(),
}));

import {
  processEmailJob,
  buildEmailJobData,
  startEmailWorker,
  EMAIL_QUEUE_NAME,
} from './email.worker.js';
import type {
  TicketCreatedJobInput,
  AgentReplyJobInput,
  TicketResolvedJobInput,
  CsatSurveyJobInput,
} from './email.worker.js';
import {
  sendEmail,
  renderTicketCreatedEmail,
  renderAgentReplyEmail,
  renderTicketResolvedEmail,
  renderCsatSurveyEmail,
} from '../services/email.service.js';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Email Worker', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(renderTicketCreatedEmail).mockReturnValue({
      subject: '[TKT-00001] Test - Ticket Received',
      html: '<p>Ticket created</p>',
    });

    vi.mocked(renderAgentReplyEmail).mockReturnValue({
      subject: 'Re: [TKT-00001] Test',
      html: '<p>Agent replied</p>',
    });

    vi.mocked(renderTicketResolvedEmail).mockReturnValue({
      subject: '[TKT-00001] Test - Resolved',
      html: '<p>Ticket resolved</p>',
    });

    vi.mocked(renderCsatSurveyEmail).mockReturnValue({
      subject: 'How was your experience? [TKT-00001]',
      html: '<p>Rate us</p>',
    });
  });

  // ==========================================
  // EMAIL_QUEUE_NAME
  // ==========================================
  describe('EMAIL_QUEUE_NAME', () => {
    it('should be the string "email"', () => {
      expect(EMAIL_QUEUE_NAME).toBe('email');
    });
  });

  // ==========================================
  // processEmailJob
  // ==========================================
  describe('processEmailJob', () => {
    it('should process a ticket_created job', async () => {
      const job: TicketCreatedJobInput = {
        type: 'ticket_created',
        to: 'client@example.com',
        ticketNumber: 'TKT-00001',
        subject: 'Login issue',
        tenantName: 'Acme Corp',
        supportEmail: 'support@acme.helpdesk.com',
        tenantId: 'tenant-uuid',
        ticketId: 'ticket-uuid',
      };

      await processEmailJob(job);

      expect(renderTicketCreatedEmail).toHaveBeenCalledWith({
        ticketNumber: 'TKT-00001',
        subject: 'Login issue',
        tenantName: 'Acme Corp',
        supportEmail: 'support@acme.helpdesk.com',
      });
      expect(sendEmail).toHaveBeenCalledWith(
        'client@example.com',
        '[TKT-00001] Test - Ticket Received',
        '<p>Ticket created</p>',
      );
    });

    it('should process an agent_reply job', async () => {
      const job: AgentReplyJobInput = {
        type: 'agent_reply',
        to: 'client@example.com',
        ticketNumber: 'TKT-00001',
        subject: 'Login issue',
        agentName: 'Marcus Lee',
        replyBody: '<p>We are on it.</p>',
        tenantName: 'Acme Corp',
        supportEmail: 'support@acme.helpdesk.com',
        tenantId: 'tenant-uuid',
        ticketId: 'ticket-uuid',
      };

      await processEmailJob(job);

      expect(renderAgentReplyEmail).toHaveBeenCalledWith({
        ticketNumber: 'TKT-00001',
        subject: 'Login issue',
        agentName: 'Marcus Lee',
        replyBody: '<p>We are on it.</p>',
        tenantName: 'Acme Corp',
        supportEmail: 'support@acme.helpdesk.com',
      });
      expect(sendEmail).toHaveBeenCalledWith(
        'client@example.com',
        'Re: [TKT-00001] Test',
        '<p>Agent replied</p>',
      );
    });

    it('should process a ticket_resolved job', async () => {
      const job: TicketResolvedJobInput = {
        type: 'ticket_resolved',
        to: 'client@example.com',
        ticketNumber: 'TKT-00001',
        subject: 'Login issue',
        tenantName: 'Acme Corp',
        supportEmail: 'support@acme.helpdesk.com',
        tenantId: 'tenant-uuid',
        ticketId: 'ticket-uuid',
      };

      await processEmailJob(job);

      expect(renderTicketResolvedEmail).toHaveBeenCalledWith({
        ticketNumber: 'TKT-00001',
        subject: 'Login issue',
        tenantName: 'Acme Corp',
        supportEmail: 'support@acme.helpdesk.com',
      });
      expect(sendEmail).toHaveBeenCalledWith(
        'client@example.com',
        '[TKT-00001] Test - Resolved',
        '<p>Ticket resolved</p>',
      );
    });

    it('should process a csat_survey job', async () => {
      const job: CsatSurveyJobInput = {
        type: 'csat_survey',
        to: 'client@example.com',
        ticketNumber: 'TKT-00001',
        subject: 'Login issue',
        surveyUrl: 'https://app.helpdesk.com/csat/token123',
        tenantName: 'Acme Corp',
        supportEmail: 'support@acme.helpdesk.com',
        tenantId: 'tenant-uuid',
        ticketId: 'ticket-uuid',
      };

      await processEmailJob(job);

      expect(renderCsatSurveyEmail).toHaveBeenCalledWith({
        ticketNumber: 'TKT-00001',
        subject: 'Login issue',
        surveyUrl: 'https://app.helpdesk.com/csat/token123',
        tenantName: 'Acme Corp',
        supportEmail: 'support@acme.helpdesk.com',
      });
      expect(sendEmail).toHaveBeenCalledWith(
        'client@example.com',
        'How was your experience? [TKT-00001]',
        '<p>Rate us</p>',
      );
    });
  });

  // ==========================================
  // buildEmailJobData
  // ==========================================
  describe('buildEmailJobData', () => {
    it('should build job data for ticket_created', () => {
      const input: TicketCreatedJobInput = {
        type: 'ticket_created',
        to: 'client@example.com',
        ticketNumber: 'TKT-00001',
        subject: 'Test subject',
        tenantName: 'Acme Corp',
        supportEmail: 'support@acme.helpdesk.com',
        tenantId: 'tenant-uuid',
        ticketId: 'ticket-uuid',
      };

      const result = buildEmailJobData(input);

      expect(result.type).toBe('ticket_created');
      expect(result.to).toBe('client@example.com');
      expect(result.tenantId).toBe('tenant-uuid');
      expect(result.ticketId).toBe('ticket-uuid');
      expect(result.ticketNumber).toBe('TKT-00001');
      expect(result.subject).toBeDefined();
      expect(result.html).toBeDefined();
    });

    it('should build job data for agent_reply', () => {
      const input: AgentReplyJobInput = {
        type: 'agent_reply',
        to: 'client@example.com',
        ticketNumber: 'TKT-00001',
        subject: 'Test subject',
        agentName: 'Marcus Lee',
        replyBody: '<p>Reply body</p>',
        tenantName: 'Acme Corp',
        supportEmail: 'support@acme.helpdesk.com',
        tenantId: 'tenant-uuid',
        ticketId: 'ticket-uuid',
      };

      const result = buildEmailJobData(input);

      expect(result.type).toBe('agent_reply');
      expect(result.to).toBe('client@example.com');
    });

    it('should build job data for ticket_resolved', () => {
      const input: TicketResolvedJobInput = {
        type: 'ticket_resolved',
        to: 'client@example.com',
        ticketNumber: 'TKT-00001',
        subject: 'Test subject',
        tenantName: 'Acme Corp',
        supportEmail: 'support@acme.helpdesk.com',
        tenantId: 'tenant-uuid',
        ticketId: 'ticket-uuid',
      };

      const result = buildEmailJobData(input);

      expect(result.type).toBe('ticket_resolved');
    });

    it('should build job data for csat_survey', () => {
      const input: CsatSurveyJobInput = {
        type: 'csat_survey',
        to: 'client@example.com',
        ticketNumber: 'TKT-00001',
        subject: 'Test subject',
        surveyUrl: 'https://app.helpdesk.com/csat/token123',
        tenantName: 'Acme Corp',
        supportEmail: 'support@acme.helpdesk.com',
        tenantId: 'tenant-uuid',
        ticketId: 'ticket-uuid',
      };

      const result = buildEmailJobData(input);

      expect(result.type).toBe('csat_survey');
      expect(result.to).toBe('client@example.com');
    });
  });

  // ==========================================
  // startEmailWorker
  // ==========================================
  describe('startEmailWorker', () => {
    it('should return a worker handle with a close method', () => {
      const worker = startEmailWorker();

      expect(worker).toBeDefined();
      expect(typeof worker.close).toBe('function');
    });

    it('should not throw when close is called', async () => {
      const worker = startEmailWorker();

      await expect(worker.close()).resolves.toBeUndefined();
    });
  });
});
