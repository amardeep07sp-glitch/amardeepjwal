import mongoose from 'mongoose';

// Generic, module-agnostic audit trail - "who did what to which record,
// when". Starts wired into Category (see category.service.js); any other
// module can start writing to it the same way (activityLogService.record)
// without a schema change.
const activityLogSchema = new mongoose.Schema(
  {
    module: { type: String, required: true, trim: true, index: true },
    action: { type: String, required: true, trim: true },
    // Null for actions that describe a whole batch rather than one record
    // (e.g. a CSV import) - everything else sets it.
    entityId: { type: mongoose.Schema.Types.ObjectId, default: null, index: true },
    entityName: { type: String, trim: true, default: '' },
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    // Small, action-specific details (e.g. { from: 'draft', to: 'published' }
    // for a status change) - deliberately loose-typed since every action
    // shape is different, unlike the rest of this schema.
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

activityLogSchema.index({ module: 1, entityId: 1, createdAt: -1 });
activityLogSchema.index({ module: 1, createdAt: -1 });

export const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);
