import { z } from 'zod';

const segmentBody = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  color: z.string().optional(),
});

export const createSegmentSchema = z.object({ body: segmentBody });
export const updateSegmentSchema = z.object({ params: z.object({ id: z.string() }), body: segmentBody.partial() });
export const segmentIdSchema = z.object({ params: z.object({ id: z.string() }) });
