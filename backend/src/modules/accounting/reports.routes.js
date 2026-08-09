import { Router } from 'express';
import { protect, authorize } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { PRIVILEGED_ROLES } from '../../constants/roles.js';
import { dateRangeQuerySchema, asOfDateQuerySchema, dayBookQuerySchema } from './reports.validation.js';
import { getProfitAndLoss, getBalanceSheet, getCashBook, getDayBook } from './reports.controller.js';

const router = Router();
const canView = authorize(...PRIVILEGED_ROLES);

router.get('/profit-and-loss', protect, canView, validate(dateRangeQuerySchema), getProfitAndLoss);
router.get('/balance-sheet', protect, canView, validate(asOfDateQuerySchema), getBalanceSheet);
router.get('/cash-book', protect, canView, validate(dateRangeQuerySchema), getCashBook);
router.get('/day-book', protect, canView, validate(dayBookQuerySchema), getDayBook);

export default router;
