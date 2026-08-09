import { Router } from 'express';
import { validate } from '../../middlewares/validate.middleware.js';
import { visitorIdParamSchema, setConsentSchema } from './privacy.validation.js';
import { deleteMyData, setConsent, getConsent } from './privacy.controller.js';

const router = Router();

router.post('/consent', validate(setConsentSchema), setConsent);
router.get('/consent/:visitorId', validate(visitorIdParamSchema), getConsent);
router.delete('/visitors/:visitorId', validate(visitorIdParamSchema), deleteMyData);

export default router;
