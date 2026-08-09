import { Router } from 'express';
import { protect, authorize } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { PRIVILEGED_ROLES } from '../../constants/roles.js';
import { createCampaignSpendSchema, campaignSpendIdSchema } from './campaignSpend.validation.js';
import { listCampaignSpend, createCampaignSpend, deleteCampaignSpend } from './campaignSpend.controller.js';

const router = Router();
const canManage = authorize(...PRIVILEGED_ROLES);

router.get('/', protect, canManage, listCampaignSpend);
router.post('/', protect, canManage, validate(createCampaignSpendSchema), createCampaignSpend);
router.delete('/:id', protect, canManage, validate(campaignSpendIdSchema), deleteCampaignSpend);

export default router;
