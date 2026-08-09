import mongoose from 'mongoose';

// "Saved Filters (future-ready)" per the Phase 11 spec - a named, reusable
// filter set for one report, scoped to the user who saved it. Nothing in
// the Reports UI auto-applies these yet; this is the plumbing (model +
// CRUD) a future pass wires a "My saved views" picker into, the same
// forward-declared-but-unwired precedent as Phase 7's Salesperson field.
const savedFilterSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    reportKey: { type: String, required: true, trim: true, index: true },
    filters: { type: mongoose.Schema.Types.Mixed, default: {} },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  },
  { timestamps: true }
);

savedFilterSchema.index({ createdBy: 1, reportKey: 1 });

export const SavedFilter = mongoose.model('SavedFilter', savedFilterSchema);
