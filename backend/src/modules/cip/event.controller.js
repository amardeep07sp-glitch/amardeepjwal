import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { eventService } from './event.service.js';
import { serializeEvent, serializeEventList } from './event.serializer.js';

// Public, unauthenticated - the tracking SDK calls this before a visitor
// has ever logged in. Always 202 regardless of whether the event was
// actually persisted (unknown type, no consent) - tracking is
// fire-and-forget by design and must never surface as an error to a
// storefront visitor.
export const trackEvent = asyncHandler(async (req, res) => {
  const event = await eventService.trackEvent(req.body, { ip: req.ip, userAgent: req.headers['user-agent'] });
  res.status(202).json(new ApiResponse(202, event ? serializeEvent(event) : null, 'Event accepted'));
});

export const listEvents = asyncHandler(async (req, res) => {
  const { items, total } = await eventService.listEvents(req.query);
  res.status(200).json(new ApiResponse(200, { items: serializeEventList(items), total }, 'Events fetched successfully'));
});

export const getSessionJourney = asyncHandler(async (req, res) => {
  const events = await eventService.getSessionJourney(req.params.sessionId);
  res.status(200).json(new ApiResponse(200, serializeEventList(events), 'Session journey fetched successfully'));
});
