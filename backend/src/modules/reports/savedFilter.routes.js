import { Router } from 'express';
import { protect, authorize } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { VIEW_ROLES } from '../../constants/roles.js';
import { createSavedFilterSchema, listSavedFiltersQuerySchema, savedFilterIdSchema } from './savedFilter.validation.js';
import { listSavedFilters, createSavedFilter, deleteSavedFilter } from './savedFilter.controller.js';

const router = Router();
const canUse = authorize(...VIEW_ROLES);

router.get('/', protect, canUse, validate(listSavedFiltersQuerySchema), listSavedFilters);
router.post('/', protect, canUse, validate(createSavedFilterSchema), createSavedFilter);
router.delete('/:id', protect, canUse, validate(savedFilterIdSchema), deleteSavedFilter);

export default router;
