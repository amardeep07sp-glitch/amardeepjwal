import mongoose from 'mongoose';
import { FEEDBACK_CATEGORY_VALUES, FEEDBACK_CATEGORIES } from './feedback.constants.js';

// Deliberately separate from SupportTicket/IssueReport (Phase 2/34 - an
// opinion is not a problem to resolve) - no status/assignment/lifecycle at
// all, just a signal an admin reads in aggregate. `customer` is required
// (see the RBAC/scope decision: reuse existing auth, no anonymous
// feedback path this pass).
const feedbackSchema = new mongoose.Schema(
  {
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
    rating: { type: Number, min: 1, max: 5, default: null },
    category: { type: String, enum: FEEDBACK_CATEGORY_VALUES, default: FEEDBACK_CATEGORIES.GENERAL, index: true },
    message: { type: String, required: true, trim: true },
    pageContext: { type: String, trim: true, default: '' },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null },
  },
  { timestamps: true }
);

feedbackSchema.index({ category: 1, createdAt: -1 });

export const Feedback = mongoose.model('Feedback', feedbackSchema);
