import mongoose from 'mongoose';
import { HELP_CATEGORY_VALUES } from './help.constants.js';

// Phase 4's Categories CRUD, WITHOUT reopening the code-stability guarantee
// help.constants.js's own header comment establishes: `code` is pinned to
// the fixed HELP_CATEGORY_VALUES enum (never admin-creatable/renamable, so
// ContextualHelp's category lookups can never silently break), but every
// DISPLAY concern - label, description, icon, ordering, whether it's
// currently shown - is real admin-editable data, not a hardcoded map.
const helpCategorySchema = new mongoose.Schema(
  {
    code: { type: String, enum: HELP_CATEGORY_VALUES, required: true, unique: true },
    label: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: '' },
    icon: { type: String, trim: true, default: '' },
    displayOrder: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

export const HelpCategory = mongoose.model('HelpCategory', helpCategorySchema);
