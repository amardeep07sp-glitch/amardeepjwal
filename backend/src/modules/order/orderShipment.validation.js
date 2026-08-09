import { z } from 'zod';
import { SHIPMENT_STATUSES } from './order.constants.js';

export const createShipmentSchema = z.object({
  params: z.object({ orderId: z.string() }),
  body: z.object({
    itemIds: z.array(z.string()).optional(),
    courier: z.string().optional(),
    trackingNumber: z.string().optional(),
    trackingUrl: z.string().optional(),
    estimatedDelivery: z.string().optional(),
  }),
});

export const updateTrackingSchema = z.object({
  params: z.object({ id: z.string() }),
  body: z.object({
    courier: z.string().optional(),
    trackingNumber: z.string().optional(),
    trackingUrl: z.string().optional(),
    status: z.enum(Object.values(SHIPMENT_STATUSES)).optional(),
  }),
});

export const shipmentIdSchema = z.object({ params: z.object({ id: z.string() }) });

export const listShipmentsQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(20),
    status: z.enum(Object.values(SHIPMENT_STATUSES)).optional(),
  }),
});
