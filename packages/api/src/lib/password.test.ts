import { describe, it, expect } from 'vitest';
import { hashPassword, comparePassword } from './password.js';

describe('password utilities', () => {
  it('should hash a password and return a bcrypt hash', async () => {
    const hash = await hashPassword('TestPassword123');
    expect(hash).toBeDefined();
    expect(hash).not.toBe('TestPassword123');
    // bcrypt hashes start with $2b$
    expect(hash.startsWith('$2b$')).toBe(true);
  });

  it('should return true when comparing a correct password', async () => {
    const password = 'SecurePass!456';
    const hash = await hashPassword(password);
    const result = await comparePassword(password, hash);
    expect(result).toBe(true);
  });

  it('should return false when comparing an incorrect password', async () => {
    const hash = await hashPassword('CorrectPassword');
    const result = await comparePassword('WrongPassword', hash);
    expect(result).toBe(false);
  });

  it('should generate different hashes for the same password (due to salt)', async () => {
    const password = 'SamePassword123';
    const hash1 = await hashPassword(password);
    const hash2 = await hashPassword(password);
    expect(hash1).not.toBe(hash2);
    // Both should still validate
    expect(await comparePassword(password, hash1)).toBe(true);
    expect(await comparePassword(password, hash2)).toBe(true);
  });
});
