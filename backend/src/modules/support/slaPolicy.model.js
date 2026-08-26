import mongoose from 'mongoose';
import { TICKET_PRIORITY_VALUES } from './support.constants.js';

// One row per priority level - a real collection (not a Mixed blob) so
// each threshold is independently validated/typed, same reasoning as
// every other typed schema in this codebase.
const slaTierSchema = new mongoose.Schema(
  {
    priority: { type: String, enum: TICKET_PRIORITY_VALUES, required: true },
    firstResponseMins: { type: Number, required: true, min: 1 },
    resolutionMins: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

// Singleton document (same "one row, findOne()-or-create" convention as
// settings.model.js) - there is only ever one active SLA policy, not one
// per admin or per campaign.
const slaPolicySchema = new mongoose.Schema(
  {
    tiers: { type: [slaTierSchema], default: [] },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

export const SlaPolicy = mongoose.model('SlaPolicy', slaPolicySchema);
