import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { newsletterService } from './newsletter.service.js';

export const subscribeNewsletter = asyncHandler(async (req, res) => {
  await newsletterService.subscribe(req.body.email);
  res.status(200).json(new ApiResponse(200, null, "You're subscribed - thanks for joining us!"));
});
