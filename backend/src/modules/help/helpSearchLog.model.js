import mongoose from 'mongoose';

// Phase 4's "Search Analytics" - one row per search-bar query, so admins
// can see both what customers search for most AND which searches came up
// empty (a strong signal for "we need an article about X"). Deliberately
// NOT deduped/aggregated at write time - the analytics reads aggregate on
// demand (helpSearchLog.repository.js), keeping the write path a single
// cheap insert, same as activityLogService's own append-only discipline.
const helpSearchLogSchema = new mongoose.Schema(
  {
    query: { type: String, required: true, trim: true, index: true },
    resultCount: { type: Number, required: true, min: 0 },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

helpSearchLogSchema.index({ createdAt: -1 });

export const HelpSearchLog = mongoose.model('HelpSearchLog', helpSearchLogSchema);
