import { counterRepository } from './counter.repository.js';

// Zero-pads the sequence and prefixes it (e.g. 'ORD' + 7 -> 'ORD-0000007').
// Kept as a pure function so the numbering format can change in one place
// without touching the atomic-increment logic above it.
const formatSequence = (prefix, seq, padLength) => `${prefix}-${String(seq).padStart(padLength, '0')}`;

export const counterService = {
  async getNextSequence(name, { prefix, padLength = 6 } = {}) {
    const seq = await counterRepository.incrementAndGet(name);
    return prefix ? formatSequence(prefix, seq, padLength) : seq;
  },
};
