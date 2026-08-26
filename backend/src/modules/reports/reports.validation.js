import { z } from 'zod';

// Shared across every report domain's query schema - the Filter Engine's
// common date-range + pagination + export-format contract.
export const reportListQuerySchema = z.object({
  query: z.object({
    dateFrom: z.string().optional(),
    dateTo: z.string().optional(),
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(200).default(20),
    search: z.string().optional(),
    // Present only on the handful of list reports that also double as an
    // export endpoint (see export.util.js#sendReportExport) - optional so
    // the same schema serves both the paginated JSON view and the export.
    format: z.enum(['csv', 'excel', 'pdf']).optional(),
  }),
});

export const reportSummaryQuerySchema = z.object({
  query: z.object({ dateFrom: z.string().optional(), dateTo: z.string().optional() }),
});

export const salesByDateQuerySchema = z.object({
  query: z.object({
    dateFrom: z.string().optional(),
    dateTo: z.string().optional(),
    groupBy: z.enum(['day', 'week', 'month']).default('day'),
  }),
});

export const reportExportQuerySchema = z.object({
  query: z.object({
    dateFrom: z.string().optional(),
    dateTo: z.string().optional(),
    format: z.enum(['csv', 'excel', 'pdf']).default('csv'),
  }),
});
