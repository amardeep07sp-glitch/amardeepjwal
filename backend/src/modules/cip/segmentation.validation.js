import { z } from 'zod';
import { SEGMENT_KEYS } from './cip.constants.js';

export const segmentKeyParamSchema = z.object({
  params: z.object({ segmentKey: z.enum(Object.values(SEGMENT_KEYS)) }),
  query: z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(200).default(50),
  }),
});
