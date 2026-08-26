import { z } from 'zod';
import { ISSUE_CATEGORY_VALUES, ISSUE_PRIORITY_VALUES, ISSUE_STATUS_VALUES } from './issue.constants.js';

const objectId = z.string().min(1);

export const issueIdSchema = z.object({ params: z.object({ id: z.string() }) });

export const listIssuesQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    status: z.enum(ISSUE_STATUS_VALUES).optional(),
    category: z.enum(ISSUE_CATEGORY_VALUES).optional(),
    priority: z.enum(ISSUE_PRIORITY_VALUES).optional(),
    assignedTo: objectId.optional(),
    entityType: z.string().optional(),
    entityId: z.string().optional(),
    search: z.string().trim().optional(),
  }),
});

export const assignIssueSchema = z.object({
  params: z.object({ id: z.string() }),
  body: z.object({ assigneeUserId: objectId }),
});

export const updateIssueStatusSchema = z.object({
  params: z.object({ id: z.string() }),
  body: z.object({ status: z.enum(ISSUE_STATUS_VALUES), resolutionNote: z.string().trim().optional() }),
});
