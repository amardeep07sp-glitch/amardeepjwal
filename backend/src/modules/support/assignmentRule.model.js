import mongoose from 'mongoose';
import { TICKET_CATEGORY_VALUES } from './support.constants.js';

// Phase 25's routing table - one rule per category (unique index), each
// pointing at a single default agent. Deliberately this simple: no
// workload-balancing, round-robin, or multi-agent pools this pass (that's
// a real scheduling subsystem of its own) - "category X always suggests
// agent Y" is the actual Phase 25 example given, and covers the real need
// (Payment issues always going to whoever handles Payments) without
// building a queueing engine nobody asked for yet.
const assignmentRuleSchema = new mongoose.Schema(
  {
    category: { type: String, enum: TICKET_CATEGORY_VALUES, required: true, unique: true },
    agentUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    active: { type: Boolean, default: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

export const AssignmentRule = mongoose.model('AssignmentRule', assignmentRuleSchema);
