import { Counter } from './counter.model.js';

export const counterRepository = {
  // Single atomic Mongo operation - concurrent callers can never receive the
  // same sequence number, which is what "prevent duplicate order numbers"
  // (Security section, Phase 7 spec) actually requires. A best-effort cache
  // (e.g. Redis) would not give this guarantee.
  async incrementAndGet(name) {
    const counter = await Counter.findOneAndUpdate(
      { _id: name },
      { $inc: { seq: 1 } },
      { upsert: true, new: true }
    );
    return counter.seq;
  },
};
