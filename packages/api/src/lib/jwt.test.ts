import { describe, it, expect } from 'vitest';
import { signToken, verifyToken, tokenRemainingTtl } from './jwt.js';

describe('JWT utilities', () => {
  const testPayload = {
    sub: '550e8400-e29b-41d4-a716-446655440000',
    tid: '660e8400-e29b-41d4-a716-446655440000',
    role: 'agent' as const,
  };

  describe('signToken', () => {
    it('should return a signed JWT string', () => {
      const token = signToken(testPayload, '8h');
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      // JWT has three parts separated by dots
      const parts = token.split('.');
      expect(parts.length).toBe(3);
    });

    it('should embed the correct claims in the token', () => {
      const token = signToken(testPayload, '8h');
      const decoded = verifyToken(token);
      expect(decoded.sub).toBe(testPayload.sub);
      expect(decoded.tid).toBe(testPayload.tid);
      expect(decoded.role).toBe(testPayload.role);
    });
  });

  describe('verifyToken', () => {
    it('should successfully verify a valid token', () => {
      const token = signToken(testPayload, '1h');
      const decoded = verifyToken(token);
      expect(decoded.sub).toBe(testPayload.sub);
      expect(decoded.tid).toBe(testPayload.tid);
      expect(decoded.role).toBe('agent');
      expect(decoded.iat).toBeDefined();
      expect(decoded.exp).toBeDefined();
      expect(decoded.exp).toBeGreaterThan(decoded.iat);
    });

    it('should throw when verifying an invalid token', () => {
      expect(() => verifyToken('invalid.token.string')).toThrow();
    });

    it('should throw when verifying a tampered token', () => {
      const token = signToken(testPayload, '1h');
      const tamperedToken = token.slice(0, -5) + 'XXXXX';
      expect(() => verifyToken(tamperedToken)).toThrow();
    });
  });

  describe('tokenRemainingTtl', () => {
    it('should return positive TTL for a future expiration', () => {
      const futureExp = Math.floor(Date.now() / 1000) + 3600;
      const ttl = tokenRemainingTtl(futureExp);
      expect(ttl).toBeGreaterThan(0);
      expect(ttl).toBeLessThanOrEqual(3600);
    });

    it('should return 0 for a past expiration', () => {
      const pastExp = Math.floor(Date.now() / 1000) - 100;
      const ttl = tokenRemainingTtl(pastExp);
      expect(ttl).toBe(0);
    });
  });
});
