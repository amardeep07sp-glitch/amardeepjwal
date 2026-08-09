import { z } from 'zod';

const tagBody = z.object({
  name: z.string().min(1, 'Name is required'),
  color: z.string().optional(),
});

export const createTagSchema = z.object({ body: tagBody });
export const updateTagSchema = z.object({ params: z.object({ id: z.string() }), body: tagBody.partial() });
export const tagIdSchema = z.object({ params: z.object({ id: z.string() }) });
