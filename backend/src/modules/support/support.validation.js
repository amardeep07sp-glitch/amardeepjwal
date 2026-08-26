import { z } from 'zod';
import {
  TICKET_CATEGORY_VALUES,
  TICKET_PRIORITY_VALUES,
  TICKET_STATUS_VALUES,
  MESSAGE_TYPE_VALUES,
} from './support.constants.js';

const objectId = z.string().min(1);

export const createTicketAdminSchema = z.object({
  body: z.object({
    customerId: objectId,
    subject: z.string().trim().min(1, 'Subject is required'),
    category: z.enum(TICKET_CATEGORY_VALUES).optional(),
    priority: z.enum(TICKET_PRIORITY_VALUES).optional(),
    message: z.string().trim().optional(),
  }),
});

export const ticketIdSchema = z.object({ params: z.object({ id: z.string() }) });

export const listTicketsQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    status: z.enum(TICKET_STATUS_VALUES).optional(),
    priority: z.enum(TICKET_PRIORITY_VALUES).optional(),
    category: z.enum(TICKET_CATEGORY_VALUES).optional(),
    assignedAgentId: objectId.optional(),
    search: z.string().trim().optional(),
  }),
});

export const assignTicketSchema = z.object({
  params: z.object({ id: z.string() }),
  body: z.object({ agentUserId: objectId.nullable() }),
});

export const updatePrioritySchema = z.object({
  params: z.object({ id: z.string() }),
  body: z.object({ priority: z.enum(TICKET_PRIORITY_VALUES) }),
});

export const updateStatusSchema = z.object({
  params: z.object({ id: z.string() }),
  body: z.object({ status: z.enum(TICKET_STATUS_VALUES), note: z.string().trim().optional() }),
});

// multipart body - fields arrive as strings via multer, same as media's
// own uploadMediaSchema convention.
export const addAgentMessageSchema = z.object({
  params: z.object({ id: z.string() }),
  body: z.object({
    content: z.string().trim().min(1, 'Message is required'),
    type: z.enum(MESSAGE_TYPE_VALUES).optional(),
  }),
});

export const setAssignmentRuleSchema = z.object({
  body: z.object({
    category: z.enum(TICKET_CATEGORY_VALUES),
    agentUserId: objectId,
  }),
});

export const assignmentRuleCategoryParamSchema = z.object({
  params: z.object({ category: z.enum(TICKET_CATEGORY_VALUES) }),
});

export const updateSlaPolicySchema = z.object({
  body: z.object({
    tiers: z
      .array(
        z.object({
          priority: z.enum(TICKET_PRIORITY_VALUES),
          firstResponseMins: z.coerce.number().int().positive(),
          resolutionMins: z.coerce.number().int().positive(),
        })
      )
      .min(1),
  }),
});
