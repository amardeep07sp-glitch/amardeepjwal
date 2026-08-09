import { Router } from 'express';
import { protect, authorize } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { VIEW_ROLES, PRIVILEGED_ROLES, ROLES } from '../../constants/roles.js';
import { createNoteSchema, updateNoteSchema, noteIdSchema, supplierIdParamSchema } from './supplierNote.validation.js';
import { listNotes, createNote, updateNote, deleteNote } from './supplierNote.controller.js';

const router = Router();
const canView = authorize(...VIEW_ROLES);
const canManage = authorize(...PRIVILEGED_ROLES, ROLES.STAFF);

router.get('/supplier/:supplierId', protect, canView, validate(supplierIdParamSchema), listNotes);
router.post('/supplier/:supplierId', protect, canManage, validate(createNoteSchema), createNote);
router.put('/:id', protect, canManage, validate(updateNoteSchema), updateNote);
router.delete('/:id', protect, canManage, validate(noteIdSchema), deleteNote);

export default router;
