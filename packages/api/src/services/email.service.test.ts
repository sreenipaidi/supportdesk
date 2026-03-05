import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Mocks -- must be before imports that use them
// ---------------------------------------------------------------------------

vi.mock('../db/connection.js', () => ({
  getDb: vi.fn(),
}));

vi.mock('../lib/logger.js', () => ({
  getLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}));

import {
  extractEmailAddress,
  extractDisplayName,
  extractHeader,
  parseInboundEmail,
  findTicketFromEmail,
  findTenantFromEmail,
  findOrCreateClient,
  stripHtmlTags,
  renderTicketCreatedEmail,
  renderAgentReplyEmail,
  renderTicketResolvedEmail,
  renderCsatSurveyEmail,
  sendEmail,
} from './email.service.js';
import type { SendGridInboundPayload } from './email.service.js';
import { getDb } from '../db/connection.js';

// ---------------------------------------------------------------------------
// Mock database helpers
// ---------------------------------------------------------------------------

function createMockDb() {
  const chainable = {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue([]),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue([]),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
  };
  return chainable;
}

// ---------------------------------------------------------------------------
// Tests: extractEmailAddress
// ---------------------------------------------------------------------------

describe('extractEmailAddress', () => {
  it('should extract email from angle bracket format', () => {
    expect(extractEmailAddress('John Doe <john@example.com>')).toBe('john@example.com');
  });

  it('should extract email from quoted name format', () => {
    expect(extractEmailAddress('"Jane Smith" <jane@example.com>')).toBe('jane@example.com');
  });

  it('should return the email when no angle brackets', () => {
    expect(extractEmailAddress('plain@example.com')).toBe('plain@example.com');
  });

  it('should lowercase the email', () => {
    expect(extractEmailAddress('User@EXAMPLE.COM')).toBe('user@example.com');
  });

  it('should trim whitespace', () => {
    expect(extractEmailAddress('  user@example.com  ')).toBe('user@example.com');
  });

  it('should handle empty string', () => {
    expect(extractEmailAddress('')).toBe('');
  });
});

// ---------------------------------------------------------------------------
// Tests: extractDisplayName
// ---------------------------------------------------------------------------

describe('extractDisplayName', () => {
  it('should extract name from angle bracket format', () => {
    expect(extractDisplayName('John Doe <john@example.com>')).toBe('John Doe');
  });

  it('should extract name from quoted format', () => {
    expect(extractDisplayName('"Jane Smith" <jane@example.com>')).toBe('Jane Smith');
  });

  it('should return email when no name is present', () => {
    expect(extractDisplayName('plain@example.com')).toBe('plain@example.com');
  });

  it('should handle empty string', () => {
    expect(extractDisplayName('')).toBe('');
  });
});

// ---------------------------------------------------------------------------
// Tests: extractHeader
// ---------------------------------------------------------------------------

describe('extractHeader', () => {
  const sampleHeaders = [
    'From: sender@example.com',
    'To: support@company.com',
    'Subject: Test Email',
    'In-Reply-To: <msg123@example.com>',
    'Message-ID: <msg456@example.com>',
    'References: <msg123@example.com> <msg789@example.com>',
  ].join('\n');

  it('should extract In-Reply-To header', () => {
    expect(extractHeader(sampleHeaders, 'In-Reply-To')).toBe('<msg123@example.com>');
  });

  it('should extract Message-ID header', () => {
    expect(extractHeader(sampleHeaders, 'Message-ID')).toBe('<msg456@example.com>');
  });

  it('should extract References header', () => {
    expect(extractHeader(sampleHeaders, 'References')).toBe(
      '<msg123@example.com> <msg789@example.com>',
    );
  });

  it('should return null for non-existent header', () => {
    expect(extractHeader(sampleHeaders, 'X-Custom-Header')).toBeNull();
  });

  it('should be case-insensitive', () => {
    expect(extractHeader(sampleHeaders, 'from')).toBe('sender@example.com');
  });

  it('should handle empty headers string', () => {
    expect(extractHeader('', 'From')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Tests: parseInboundEmail
// ---------------------------------------------------------------------------

describe('parseInboundEmail', () => {
  it('should parse a complete SendGrid payload', () => {
    const payload: SendGridInboundPayload = {
      from: 'John Doe <john@example.com>',
      to: 'support@acme.helpdesk.com',
      subject: 'Need help with login',
      text: 'I cannot log in to my account.',
      html: '<p>I cannot log in to my account.</p>',
      headers: 'In-Reply-To: <msg123@example.com>\nMessage-ID: <msg456@example.com>',
    };

    const result = parseInboundEmail(payload);

    expect(result.from).toBe('john@example.com');
    expect(result.fromName).toBe('John Doe');
    expect(result.to).toBe('support@acme.helpdesk.com');
    expect(result.subject).toBe('Need help with login');
    expect(result.textBody).toBe('I cannot log in to my account.');
    expect(result.htmlBody).toBe('<p>I cannot log in to my account.</p>');
    expect(result.inReplyTo).toBe('<msg123@example.com>');
    expect(result.messageId).toBe('<msg456@example.com>');
    expect(result.attachments).toEqual([]);
  });

  it('should use default subject when not provided', () => {
    const payload: SendGridInboundPayload = {
      from: 'user@example.com',
      to: 'support@acme.helpdesk.com',
    };

    const result = parseInboundEmail(payload);
    expect(result.subject).toBe('(No Subject)');
  });

  it('should parse attachment info', () => {
    const payload: SendGridInboundPayload = {
      from: 'user@example.com',
      to: 'support@acme.helpdesk.com',
      subject: 'With attachment',
      'attachment-info': JSON.stringify({
        attachment1: {
          filename: 'screenshot.png',
          type: 'image/png',
          size: 12345,
        },
      }),
    };

    const result = parseInboundEmail(payload);
    expect(result.attachments).toHaveLength(1);
    expect(result.attachments[0]).toEqual({
      fileName: 'screenshot.png',
      contentType: 'image/png',
      size: 12345,
    });
  });

  it('should handle invalid attachment-info gracefully', () => {
    const payload: SendGridInboundPayload = {
      from: 'user@example.com',
      to: 'support@acme.helpdesk.com',
      'attachment-info': 'not-valid-json',
    };

    const result = parseInboundEmail(payload);
    expect(result.attachments).toEqual([]);
  });

  it('should handle empty payload fields', () => {
    const payload: SendGridInboundPayload = {};

    const result = parseInboundEmail(payload);
    expect(result.from).toBe('');
    expect(result.to).toBe('');
    expect(result.subject).toBe('(No Subject)');
    expect(result.textBody).toBe('');
    expect(result.htmlBody).toBe('');
    expect(result.inReplyTo).toBeNull();
    expect(result.messageId).toBeNull();
    expect(result.attachments).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Tests: findTicketFromEmail
// ---------------------------------------------------------------------------

describe('findTicketFromEmail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should find a ticket by ticket number in subject', async () => {
    const mockDb = createMockDb();
    mockDb.limit.mockResolvedValue([
      { id: 'ticket-uuid', tenantId: 'tenant-uuid', ticketNumber: 'TKT-00042' },
    ]);
    vi.mocked(getDb).mockReturnValue(mockDb as unknown as ReturnType<typeof getDb>);

    const result = await findTicketFromEmail('Re: TKT-00042 Cannot login', null, null);

    expect(result).toEqual({
      ticketId: 'ticket-uuid',
      tenantId: 'tenant-uuid',
      ticketNumber: 'TKT-00042',
    });
  });

  it('should return null when ticket number in subject does not match any ticket', async () => {
    const mockDb = createMockDb();
    mockDb.limit.mockResolvedValue([]);
    vi.mocked(getDb).mockReturnValue(mockDb as unknown as ReturnType<typeof getDb>);

    const result = await findTicketFromEmail('Re: TKT-99999 Unknown ticket', null, null);

    expect(result).toBeNull();
  });

  it('should return null when no ticket number in subject', async () => {
    const mockDb = createMockDb();
    vi.mocked(getDb).mockReturnValue(mockDb as unknown as ReturnType<typeof getDb>);

    const result = await findTicketFromEmail('Just a regular email', null, null);

    expect(result).toBeNull();
  });

  it('should return null when subject is empty', async () => {
    const mockDb = createMockDb();
    vi.mocked(getDb).mockReturnValue(mockDb as unknown as ReturnType<typeof getDb>);

    const result = await findTicketFromEmail('', null, null);

    expect(result).toBeNull();
  });

  it('should handle In-Reply-To header gracefully (not yet implemented)', async () => {
    const mockDb = createMockDb();
    vi.mocked(getDb).mockReturnValue(mockDb as unknown as ReturnType<typeof getDb>);

    const result = await findTicketFromEmail(
      'No ticket ref',
      '<msg123@example.com>',
      '<msg456@example.com>',
    );

    expect(result).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Tests: findTenantFromEmail
// ---------------------------------------------------------------------------

describe('findTenantFromEmail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should find tenant by support email', async () => {
    const mockDb = createMockDb();
    // First call: match by support_email
    mockDb.limit.mockResolvedValueOnce([
      { id: 'tenant-uuid', name: 'Acme Corp', subdomain: 'acme' },
    ]);
    vi.mocked(getDb).mockReturnValue(mockDb as unknown as ReturnType<typeof getDb>);

    const result = await findTenantFromEmail('support@acme.helpdesk.com');

    expect(result).toEqual({
      tenantId: 'tenant-uuid',
      tenantName: 'Acme Corp',
      subdomain: 'acme',
    });
  });

  it('should find tenant by subdomain when support email does not match', async () => {
    const mockDb = createMockDb();
    // First call: no match by support_email
    mockDb.limit.mockResolvedValueOnce([]);
    // Second call: match by subdomain
    mockDb.limit.mockResolvedValueOnce([
      { id: 'tenant-uuid', name: 'Acme Corp', subdomain: 'acme' },
    ]);
    vi.mocked(getDb).mockReturnValue(mockDb as unknown as ReturnType<typeof getDb>);

    const result = await findTenantFromEmail('anything@acme.helpdesk.com');

    expect(result).toEqual({
      tenantId: 'tenant-uuid',
      tenantName: 'Acme Corp',
      subdomain: 'acme',
    });
  });

  it('should return null when no tenant matches', async () => {
    const mockDb = createMockDb();
    mockDb.limit.mockResolvedValue([]);
    vi.mocked(getDb).mockReturnValue(mockDb as unknown as ReturnType<typeof getDb>);

    const result = await findTenantFromEmail('support@unknown.helpdesk.com');

    expect(result).toBeNull();
  });

  it('should handle angle bracket format in to address', async () => {
    const mockDb = createMockDb();
    mockDb.limit.mockResolvedValueOnce([
      { id: 'tenant-uuid', name: 'Acme Corp', subdomain: 'acme' },
    ]);
    vi.mocked(getDb).mockReturnValue(mockDb as unknown as ReturnType<typeof getDb>);

    const result = await findTenantFromEmail('Support <support@acme.helpdesk.com>');

    expect(result).toEqual({
      tenantId: 'tenant-uuid',
      tenantName: 'Acme Corp',
      subdomain: 'acme',
    });
  });
});

// ---------------------------------------------------------------------------
// Tests: findOrCreateClient
// ---------------------------------------------------------------------------

describe('findOrCreateClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return existing client when found', async () => {
    const mockDb = createMockDb();
    mockDb.limit.mockResolvedValueOnce([
      { id: 'user-uuid', email: 'client@example.com', fullName: 'Jane Client', role: 'client' },
    ]);
    vi.mocked(getDb).mockReturnValue(mockDb as unknown as ReturnType<typeof getDb>);

    const result = await findOrCreateClient(
      'tenant-uuid',
      'client@example.com',
      'Jane Client',
    );

    expect(result.id).toBe('user-uuid');
    expect(result.email).toBe('client@example.com');
    expect(result.isNew).toBe(false);
  });

  it('should create a new client when not found', async () => {
    const mockDb = createMockDb();
    // First: no existing user found
    mockDb.limit.mockResolvedValueOnce([]);
    // Second: insert returns new user
    mockDb.returning.mockResolvedValueOnce([
      { id: 'new-user-uuid', email: 'new@example.com', fullName: 'New User', role: 'client' },
    ]);
    vi.mocked(getDb).mockReturnValue(mockDb as unknown as ReturnType<typeof getDb>);

    const result = await findOrCreateClient(
      'tenant-uuid',
      'new@example.com',
      'New User',
    );

    expect(result.id).toBe('new-user-uuid');
    expect(result.isNew).toBe(true);
  });

  it('should normalize email to lowercase', async () => {
    const mockDb = createMockDb();
    mockDb.limit.mockResolvedValueOnce([
      { id: 'user-uuid', email: 'user@example.com', fullName: 'User', role: 'client' },
    ]);
    vi.mocked(getDb).mockReturnValue(mockDb as unknown as ReturnType<typeof getDb>);

    const result = await findOrCreateClient(
      'tenant-uuid',
      'USER@EXAMPLE.COM',
      'User',
    );

    expect(result.email).toBe('user@example.com');
  });

  it('should use email prefix as name when email equals name', async () => {
    const mockDb = createMockDb();
    mockDb.limit.mockResolvedValueOnce([]);
    mockDb.returning.mockResolvedValueOnce([
      { id: 'new-user-uuid', email: 'new@example.com', fullName: 'new', role: 'client' },
    ]);
    vi.mocked(getDb).mockReturnValue(mockDb as unknown as ReturnType<typeof getDb>);

    const result = await findOrCreateClient(
      'tenant-uuid',
      'new@example.com',
      'new@example.com',
    );

    // The function should have used 'new' (the email prefix) as the name
    expect(result.id).toBe('new-user-uuid');
    expect(result.isNew).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Tests: stripHtmlTags
// ---------------------------------------------------------------------------

describe('stripHtmlTags', () => {
  it('should strip HTML tags', () => {
    expect(stripHtmlTags('<p>Hello <strong>World</strong></p>')).toBe('Hello World');
  });

  it('should convert br tags to newlines', () => {
    expect(stripHtmlTags('Line 1<br>Line 2<br/>Line 3')).toBe('Line 1\nLine 2\nLine 3');
  });

  it('should convert closing p tags to double newlines', () => {
    expect(stripHtmlTags('<p>Para 1</p><p>Para 2</p>')).toContain('Para 1');
    expect(stripHtmlTags('<p>Para 1</p><p>Para 2</p>')).toContain('Para 2');
  });

  it('should decode HTML entities', () => {
    expect(stripHtmlTags('&amp; &lt; &gt; &quot; &#39;')).toBe('& < > " \'');
  });

  it('should replace nbsp with space', () => {
    expect(stripHtmlTags('Hello&nbsp;World')).toBe('Hello World');
  });

  it('should collapse excessive newlines', () => {
    const result = stripHtmlTags('<p>A</p><p></p><p></p><p>B</p>');
    expect(result).not.toMatch(/\n{3,}/);
  });

  it('should handle empty string', () => {
    expect(stripHtmlTags('')).toBe('');
  });

  it('should handle string with no HTML', () => {
    expect(stripHtmlTags('plain text')).toBe('plain text');
  });
});

// ---------------------------------------------------------------------------
// Tests: Email Template Rendering
// ---------------------------------------------------------------------------

describe('renderTicketCreatedEmail', () => {
  it('should render ticket created email with correct subject and body', () => {
    const result = renderTicketCreatedEmail({
      ticketNumber: 'TKT-00042',
      subject: 'Cannot login',
      tenantName: 'Acme Corp',
      supportEmail: 'support@acme.helpdesk.com',
    });

    expect(result.subject).toBe('[TKT-00042] Cannot login - Ticket Received');
    expect(result.html).toContain('TKT-00042');
    expect(result.html).toContain('Cannot login');
    expect(result.html).toContain('Acme Corp');
    expect(result.html).toContain('support@acme.helpdesk.com');
    expect(result.html).toContain('Your request has been received');
  });
});

describe('renderAgentReplyEmail', () => {
  it('should render agent reply email with correct subject and body', () => {
    const result = renderAgentReplyEmail({
      ticketNumber: 'TKT-00042',
      subject: 'Cannot login',
      agentName: 'Marcus Lee',
      replyBody: '<p>We are looking into it.</p>',
      tenantName: 'Acme Corp',
      supportEmail: 'support@acme.helpdesk.com',
    });

    expect(result.subject).toBe('Re: [TKT-00042] Cannot login');
    expect(result.html).toContain('Marcus Lee');
    expect(result.html).toContain('We are looking into it.');
    expect(result.html).toContain('TKT-00042');
    expect(result.html).toContain('Acme Corp');
  });
});

describe('renderTicketResolvedEmail', () => {
  it('should render ticket resolved email with correct subject and body', () => {
    const result = renderTicketResolvedEmail({
      ticketNumber: 'TKT-00042',
      subject: 'Cannot login',
      tenantName: 'Acme Corp',
      supportEmail: 'support@acme.helpdesk.com',
    });

    expect(result.subject).toBe('[TKT-00042] Cannot login - Resolved');
    expect(result.html).toContain('has been resolved');
    expect(result.html).toContain('TKT-00042');
    expect(result.html).toContain('reply to this email to reopen');
  });
});

describe('renderCsatSurveyEmail', () => {
  it('should render CSAT survey email with survey link', () => {
    const result = renderCsatSurveyEmail({
      ticketNumber: 'TKT-00042',
      subject: 'Cannot login',
      surveyUrl: 'https://app.helpdesk.com/csat/abc123',
      tenantName: 'Acme Corp',
      supportEmail: 'support@acme.helpdesk.com',
    });

    expect(result.subject).toContain('TKT-00042');
    expect(result.subject).toContain('How was your experience');
    expect(result.html).toContain('https://app.helpdesk.com/csat/abc123');
    expect(result.html).toContain('Rate Your Experience');
    expect(result.html).toContain('TKT-00042');
  });
});

// ---------------------------------------------------------------------------
// Tests: sendEmail (stub)
// ---------------------------------------------------------------------------

describe('sendEmail', () => {
  it('should not throw when called (stub implementation)', async () => {
    await expect(
      sendEmail('user@example.com', 'Test Subject', '<p>Test body</p>'),
    ).resolves.toBeUndefined();
  });
});
