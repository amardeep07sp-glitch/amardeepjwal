import { Router } from 'express';
import { validate } from '../../middlewares/validate.middleware.js';
import { endSessionSchema } from './session.validation.js';
import { endSession } from './session.controller.js';

const router = Router();
router.post('/:sessionId/end', validate(endSessionSchema), endSession);

export default router;
