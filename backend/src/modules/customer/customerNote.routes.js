import { Router } from 'express';
import { protect, authorize } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { VIEW_ROLES, PRIVILEGED_ROLES, ROLES } from '../../constants/roles.js';
import { createNoteSchema, updateNoteSchema, noteIdSchema, customerIdParamSchema } from './customerNote.validation.js';
import { listNotes, createNote, updateNote, deleteNote } from './customerNote.controller.js';

const router = Router();
const canView = authorize(...VIEW_ROLES);
const canManage = authorize(...PRIVILEGED_ROLES, ROLES.STAFF);

router.get('/customer/:customerId', protect, canView, validate(customerIdParamSchema), listNotes);
router.post('/customer/:customerId', protect, canManage, validate(createNoteSchema), createNote);
router.put('/:id', protect, canManage, validate(updateNoteSchema), updateNote);
router.delete('/:id', protect, canManage, validate(noteIdSchema), deleteNote);

export default router;
