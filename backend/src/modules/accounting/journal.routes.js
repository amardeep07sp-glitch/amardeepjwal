import { Router } from 'express';
import { protect, authorize } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { PRIVILEGED_ROLES } from '../../constants/roles.js';
import { createManualJournalSchema, reverseJournalSchema, journalIdSchema, listJournalsQuerySchema } from './journal.validation.js';
import { listJournals, getJournalById, createManualJournal, reverseJournal } from './journal.controller.js';

const router = Router();
const canManage = authorize(...PRIVILEGED_ROLES);

router.get('/', protect, canManage, validate(listJournalsQuerySchema), listJournals);
router.post('/', protect, canManage, validate(createManualJournalSchema), createManualJournal);
router.get('/:id', protect, canManage, validate(journalIdSchema), getJournalById);
router.patch('/:id/reverse', protect, canManage, validate(reverseJournalSchema), reverseJournal);

export default router;
