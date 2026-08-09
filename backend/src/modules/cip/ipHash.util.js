import { createHash } from 'crypto';

// "IP Masking Ready" satisfied by construction, not as an optional toggle -
// this is the ONLY form an IP address is ever allowed to reach storage in.
// One-way (SHA-256, truncated) so it's still useful for coarse dedup
// ("how many distinct IPs hit this endpoint today") without the raw
// address ever being persisted or reversible.
export function hashIp(ip) {
  if (!ip) return '';
  return createHash('sha256').update(ip).digest('hex').slice(0, 16);
}
