import { describe, it, expect } from '@jest/globals';
import { hashIp } from '../src/modules/cip/ipHash.util.js';

describe('hashIp', () => {
  it('returns an empty string for a missing IP rather than hashing "undefined"', () => {
    expect(hashIp(undefined)).toBe('');
    expect(hashIp('')).toBe('');
  });

  it('is deterministic - the same IP always hashes the same way', () => {
    expect(hashIp('203.0.113.42')).toBe(hashIp('203.0.113.42'));
  });

  it('produces different hashes for different IPs', () => {
    expect(hashIp('203.0.113.42')).not.toBe(hashIp('203.0.113.43'));
  });

  it('never returns the raw IP itself', () => {
    const ip = '203.0.113.42';
    expect(hashIp(ip)).not.toContain(ip);
  });

  it('is a short, fixed-length hex string, not a full unbounded hash', () => {
    expect(hashIp('203.0.113.42')).toMatch(/^[0-9a-f]{16}$/);
  });
});
