import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { sessionService } from './session.service.js';
import { serializeSession, serializeSessionList } from './session.serializer.js';

// Public - a beforeunload/sendBeacon call from the storefront so a
// session's duration/bounce figures are accurate immediately rather than
// waiting for the stale-session sweep's next tick.
export const endSession = asyncHandler(async (req, res) => {
  const session = await sessionService.closeSession(req.params.sessionId);
  res.status(200).json(new ApiResponse(200, session ? serializeSession(session) : null, 'Session ended'));
});

export const listSessions = asyncHandler(async (req, res) => {
  const result = await sessionService.listSessions(req.query);
  res.status(200).json(new ApiResponse(200, { items: serializeSessionList(result.items), meta: result.meta }, 'Sessions fetched successfully'));
});

export const getActiveSessionCount = asyncHandler(async (req, res) => {
  const count = await sessionService.getActiveSessionCount();
  res.status(200).json(new ApiResponse(200, { count }, 'Active session count fetched successfully'));
});
