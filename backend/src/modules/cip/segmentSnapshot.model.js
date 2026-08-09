import mongoose from 'mongoose';
import { SEGMENT_KEYS } from './cip.constants.js';

// CIP's OWN computed intelligence - deliberately separate from Phase 8's
// CRM-owned Customer.segments/tags (customerSegment.model.js). A customer
// can belong to several of these at once (e.g. both "returning" and
// "high_value"). Recomputed wholesale on demand/on a schedule
// (segmentation.service.js#recomputeAllSegments) - this collection is
// always a disposable, rebuildable CACHE of the last computation, never
// hand-edited, and NEVER written onto the real Customer record (see the
// module's header comment - "It never modifies... CRM").
const segmentSnapshotSchema = new mongoose.Schema(
  {
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true, unique: true, index: true },
    segments: [{ type: String, enum: Object.values(SEGMENT_KEYS) }],
    metrics: { type: mongoose.Schema.Types.Mixed, default: {} },
    computedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

segmentSnapshotSchema.index({ segments: 1 });

export const SegmentSnapshot = mongoose.model('SegmentSnapshot', segmentSnapshotSchema);
