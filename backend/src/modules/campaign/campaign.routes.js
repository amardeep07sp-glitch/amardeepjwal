import { Router } from 'express';
import { protect, authorize } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { VIEW_ROLES, PRIVILEGED_ROLES } from '../../constants/roles.js';
import {
  createCampaignSchema,
  updateCampaignSchema,
  campaignIdSchema,
  listCampaignsQuerySchema,
  setCampaignStatusSchema,
} from './campaign.validation.js';
import { listCampaigns, getCampaignById, createCampaign, updateCampaign, deleteCampaign, setCampaignStatus } from './campaign.controller.js';

const router = Router();
const canView = authorize(...VIEW_ROLES);
const canManage = authorize(...PRIVILEGED_ROLES);

router.get('/', protect, canView, validate(listCampaignsQuerySchema), listCampaigns);
router.post('/', protect, canManage, validate(createCampaignSchema), createCampaign);

router.get('/:id', protect, canView, validate(campaignIdSchema), getCampaignById);
router.patch('/:id', protect, canManage, validate(updateCampaignSchema), updateCampaign);
router.patch('/:id/status', protect, canManage, validate(setCampaignStatusSchema), setCampaignStatus);
router.delete('/:id', protect, canManage, validate(campaignIdSchema), deleteCampaign);

export default router;
