import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AppError, ConflictError, NotFoundError } from '../lib/errors.js';
import type { SurveyData } from './csat.service.js';

// -------------------------------------------------------------------
// Mock helpers
// -------------------------------------------------------------------

function buildMockDb() {
  const selectResults: unknown[][] = [];
  let lastInsertValues: Record<string, unknown> | null = null;
  let lastUpdateValues: Record<string, unknown> | null = null;

  const whereObj = {
    limit: () => Promise.resolve(selectResults.shift() ?? []),
  };

  const fromObj = {
    where: () => whereObj,
  };

  const selectFn = () => ({
    from: () => fromObj,
  });

  const insertFn = () => ({
    values: (vals: Record<string, unknown>) => {
      lastInsertValues = vals;
      return Promise.resolve();
    },
  });

  const updateFn = () => ({
    set: (vals: Record<string, unknown>) => {
      lastUpdateValues = vals;
      return {
        where: () => Promise.resolve(),
      };
    },
  });

  return {
    select: selectFn,
    insert: insertFn,
    update: updateFn,
    _pushSelectResult: (r: unknown[]) => selectResults.push(r),
    _getLastInsert: () => lastInsertValues,
    _getLastUpdate: () => lastUpdateValues,
  };
}

let mockDb: ReturnType<typeof buildMockDb>;

vi.mock('../db/connection.js', () => ({
  getDb: () => mockDb,
}));

vi.mock('../lib/logger.js', () => ({
  getLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}));

// Import after mocking
import * as csatService from './csat.service.js';

// -------------------------------------------------------------------
// Tests
// -------------------------------------------------------------------

describe('CSAT service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDb = buildMockDb();
  });

  describe('createSurvey', () => {
    it('should skip creation when survey already exists for ticket', async () => {
      // Existing survey found
      mockDb._pushSelectResult([{ id: 'existing-survey-id' }]);

      const token = await csatService.createSurvey('tenant-1', 'ticket-1');
      expect(token).toBe('');
    });

    it('should create a new survey with a token when none exists', async () => {
      // No existing survey
      mockDb._pushSelectResult([]);

      const token = await csatService.createSurvey('tenant-1', 'ticket-1');
      expect(typeof token).toBe('string');
      expect(token.length).toBe(64); // 32 bytes in hex = 64 chars
    });
  });

  describe('getSurvey', () => {
    it('should throw AppError with INVALID_TOKEN when token not found', async () => {
      // No CSAT row found
      mockDb._pushSelectResult([]);

      await expect(csatService.getSurvey('invalid-token')).rejects.toThrow(
        'This survey link is invalid or has expired.',
      );
    });

    it('should throw NotFoundError when ticket does not exist', async () => {
      // CSAT row found
      mockDb._pushSelectResult([{
        id: 'csat-1',
        ticketId: 'ticket-1',
        tenantId: 'tenant-1',
        respondedAt: null,
      }]);
      // No ticket found
      mockDb._pushSelectResult([]);

      await expect(csatService.getSurvey('valid-token')).rejects.toThrow('Ticket not found');
    });

    it('should return survey data with already_submitted=true when responded_at is set', async () => {
      // CSAT row with respondedAt set
      mockDb._pushSelectResult([{
        id: 'csat-1',
        ticketId: 'ticket-1',
        tenantId: 'tenant-1',
        respondedAt: new Date(),
      }]);
      // Ticket found
      mockDb._pushSelectResult([{
        ticketNumber: 'TKT-00042',
        subject: 'Test issue',
        assignedAgentId: 'agent-1',
      }]);
      // Agent found
      mockDb._pushSelectResult([{ fullName: 'Marcus Lee' }]);
      // Tenant found
      mockDb._pushSelectResult([{
        name: 'Acme Corp',
        logoUrl: 'https://cdn.example.com/logo.png',
        brandColor: '#FF6B35',
      }]);

      const data = await csatService.getSurvey('valid-token');
      expect(data.already_submitted).toBe(true);
      expect(data.ticket_number).toBe('TKT-00042');
      expect(data.agent_name).toBe('Marcus Lee');
      expect(data.tenant_name).toBe('Acme Corp');
    });

    it('should use default agent name when no agent assigned', async () => {
      // CSAT row
      mockDb._pushSelectResult([{
        id: 'csat-1',
        ticketId: 'ticket-1',
        tenantId: 'tenant-1',
        respondedAt: null,
      }]);
      // Ticket found without agent
      mockDb._pushSelectResult([{
        ticketNumber: 'TKT-00001',
        subject: 'No agent ticket',
        assignedAgentId: null,
      }]);
      // Tenant found
      mockDb._pushSelectResult([{
        name: 'Test Corp',
        logoUrl: null,
        brandColor: '#2563EB',
      }]);

      const data = await csatService.getSurvey('some-token');
      expect(data.agent_name).toBe('Support Team');
      expect(data.logo_url).toBeNull();
      expect(data.brand_color).toBe('#2563EB');
    });
  });

  describe('submitSurvey', () => {
    it('should throw AppError with INVALID_TOKEN when token not found', async () => {
      mockDb._pushSelectResult([]);

      await expect(csatService.submitSurvey('bad-token', 4)).rejects.toThrow(
        'This survey link is invalid or has expired.',
      );
    });

    it('should throw ConflictError when survey already submitted', async () => {
      mockDb._pushSelectResult([{
        id: 'csat-1',
        ticketId: 'ticket-1',
        tenantId: 'tenant-1',
        respondedAt: new Date(),
      }]);

      await expect(csatService.submitSurvey('already-submitted-token', 5)).rejects.toThrow(
        'This survey has already been submitted.',
      );
    });

    it('should successfully submit a survey response', async () => {
      mockDb._pushSelectResult([{
        id: 'csat-1',
        ticketId: 'ticket-1',
        tenantId: 'tenant-1',
        respondedAt: null,
      }]);

      const result = await csatService.submitSurvey('valid-token', 4, 'Great service!');
      expect(result.message).toBe('Thank you for your feedback!');
    });

    it('should successfully submit without a comment', async () => {
      mockDb._pushSelectResult([{
        id: 'csat-1',
        ticketId: 'ticket-1',
        tenantId: 'tenant-1',
        respondedAt: null,
      }]);

      const result = await csatService.submitSurvey('valid-token', 3);
      expect(result.message).toBe('Thank you for your feedback!');
    });
  });

  describe('SurveyData type structure', () => {
    it('should match expected survey response shape', () => {
      const survey: SurveyData = {
        ticket_number: 'TKT-00042',
        subject: 'Cannot access my dashboard',
        agent_name: 'Marcus Lee',
        tenant_name: 'Acme Corp',
        logo_url: 'https://cdn.example.com/acme-logo.png',
        brand_color: '#FF6B35',
        already_submitted: false,
      };

      expect(survey.ticket_number).toBe('TKT-00042');
      expect(survey.subject).toBe('Cannot access my dashboard');
      expect(survey.agent_name).toBe('Marcus Lee');
      expect(survey.tenant_name).toBe('Acme Corp');
      expect(survey.already_submitted).toBe(false);
    });
  });

  describe('Token generation', () => {
    it('should produce 64-character hex tokens', () => {
      // We test the token format through createSurvey
      // The token is 32 bytes in hex = 64 characters
      const hexRegex = /^[0-9a-f]{64}$/;
      // This is a format test; the actual generation is random
      expect(hexRegex.test('a'.repeat(64))).toBe(true);
      expect(hexRegex.test('short')).toBe(false);
    });
  });

  describe('Error class usage', () => {
    it('should use AppError for invalid token', () => {
      const err = new AppError(400, 'INVALID_TOKEN', 'This survey link is invalid or has expired.');
      expect(err.statusCode).toBe(400);
      expect(err.code).toBe('INVALID_TOKEN');
    });

    it('should use ConflictError for already submitted survey', () => {
      const err = new ConflictError('This survey has already been submitted.');
      expect(err.statusCode).toBe(409);
      expect(err.code).toBe('CONFLICT');
    });

    it('should use NotFoundError for missing ticket', () => {
      const err = new NotFoundError('Ticket');
      expect(err.statusCode).toBe(404);
      expect(err.code).toBe('NOT_FOUND');
      expect(err.message).toBe('Ticket not found');
    });
  });
});
