import { z } from 'zod';

const noteBody = z.object({
  content: z.string().min(1, 'Content is required'),
  isPrivate: z.boolean().optional(),
  isPinned: z.boolean().optional(),
  attachments: z.array(z.string()).optional(),
});

export const createNoteSchema = z.object({ params: z.object({ customerId: z.string() }), body: noteBody });
export const updateNoteSchema = z.object({ params: z.object({ id: z.string() }), body: noteBody.partial() });
export const noteIdSchema = z.object({ params: z.object({ id: z.string() }) });
export const customerIdParamSchema = z.object({ params: z.object({ customerId: z.string() }) });
