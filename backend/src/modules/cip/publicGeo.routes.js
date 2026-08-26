import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../../middlewares/validate.middleware.js';
import { eventLimiter } from '../../middlewares/rateLimiter.middleware.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { resolveLocationFromCoords, resolveLocationFromIp } from './geo.util.js';

const reverseLookupSchema = z.object({
  body: z.object({
    lat: z.coerce.number().min(-90).max(90),
    lng: z.coerce.number().min(-180).max(180),
  }),
});

// Public and unauthenticated on purpose - the header's "Deliver to"
// location detector (client/src/lib/deliveryLocation.js) needs this for a
// guest who hasn't logged in yet, not just a signed-in customer. Never
// persists anything - a pure lat/lng -> city/state passthrough over the
// same cached resolveLocationFromCoords() the login-location capture uses.
const router = Router();

router.post(
  '/reverse-lookup',
  eventLimiter,
  validate(reverseLookupSchema),
  asyncHandler(async (req, res) => {
    const location = await resolveLocationFromCoords(req.body.lat, req.body.lng);
    res.status(200).json(new ApiResponse(200, location, 'Location resolved'));
  })
);

// GPS (above) is more PRECISE when a visitor grants it - pinpoints an
// actual point, not just a city. But it only ever works if they grant the
// permission prompt, and on a desktop/laptop with no real GPS chip the
// browser's own network-position fallback can land in the wrong city
// entirely. IP geolocation is the opposite trade-off: always available
// (no prompt, no denial), but only ever city-level - the same
// resolveLocationFromIp() CIP visit-tracking already relies on for that
// reason. deliveryLocation.js tries GPS first and falls back to this when
// GPS is denied/unavailable/times out, rather than picking one and losing
// the other's strength.
router.get(
  '/detect-by-ip',
  eventLimiter,
  asyncHandler(async (req, res) => {
    const location = await resolveLocationFromIp(req.ip);
    res.status(200).json(new ApiResponse(200, location, 'Location resolved'));
  })
);

export default router;
