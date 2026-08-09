import { z } from 'zod';
import { EVENT_TYPES } from './cip.constants.js';

export const trackEventSchema = z.object({
  body: z.object({
    eventType: z.enum(Object.values(EVENT_TYPES)),
    sessionId: z.string().min(1),
    visitorId: z.string().min(1),
    customerId: z.string().optional().nullable(),
    isRegistered: z.boolean().optional(),
    page: z.string().optional(),
    pageType: z.string().optional(),
    metadata: z.record(z.string(), z.any()).optional(),
    screenResolution: z.string().optional(),
    language: z.string().optional(),
    timezone: z.string().optional(),
    network: z.string().optional(),
    referrer: z.string().optional(),
    utmSource: z.string().optional(),
    utmMedium: z.string().optional(),
    utmCampaign: z.string().optional(),
    utmTerm: z.string().optional(),
    utmContent: z.string().optional(),
    landingPage: z.string().optional(),
  }),
});

export const listEventsQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(200).default(50),
    eventType: z.enum(Object.values(EVENT_TYPES)).optional(),
    sessionId: z.string().optional(),
    visitorId: z.string().optional(),
    customer: z.string().optional(),
    dateFrom: z.string().optional(),
    dateTo: z.string().optional(),
  }),
});

export const sessionIdParamSchema = z.object({ params: z.object({ sessionId: z.string().min(1) }) });
