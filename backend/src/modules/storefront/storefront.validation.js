import { z } from 'zod';
import { ADDRESS_TYPES, GENDERS } from '../customer/customer.constants.js';
import { PAYMENT_METHODS, ORDER_STATUSES } from '../order/order.constants.js';
import { TICKET_CATEGORY_VALUES, TICKET_PRIORITY_VALUES, TICKET_STATUS_VALUES } from '../support/support.constants.js';
import { ISSUE_CATEGORY_VALUES, ISSUE_STATUS_VALUES } from '../issue/issue.constants.js';
import { FEEDBACK_CATEGORY_VALUES } from '../feedback/feedback.constants.js';

export const recordLoginLocationSchema = z.object({
  body: z.object({
    lat: z.coerce.number().min(-90).max(90),
    lng: z.coerce.number().min(-180).max(180),
  }),
});

const addressBody = z.object({
  type: z.enum(Object.values(ADDRESS_TYPES)).optional(),
  label: z.string().optional(),
  line1: z.string().min(1, 'Address line 1 is required'),
  line2: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  postalCode: z.string().min(1, 'Postal code is required'),
  country: z.string().optional(),
  phone: z.string().min(1, 'Phone number is required'),
  isDefaultBilling: z.boolean().optional(),
  isDefaultShipping: z.boolean().optional(),
});

export const createMyAddressSchema = z.object({ body: addressBody });

export const updateMyAddressSchema = z.object({
  params: z.object({ id: z.string() }),
  body: addressBody.partial(),
});

export const addressIdParamSchema = z.object({ params: z.object({ id: z.string() }) });

const checkoutItem = z.object({
  product: z.string().min(1),
  variant: z.string().optional().nullable(),
  quantity: z.coerce.number().min(1),
});

// Only a Checkout Method's already-real payment methods (order.constants.js)
// - "cash" or "card" etc. would imply a manual-payment recording flow that
// only ever makes sense for a staff-operated POS, not a self-checkout.
const CHECKOUT_PAYMENT_METHODS = [PAYMENT_METHODS.COD, PAYMENT_METHODS.RAZORPAY];

export const checkoutSchema = z.object({
  body: z.object({
    items: z.array(checkoutItem).min(1, 'Cart is empty'),
    shippingAddress: z.string().min(1, 'Shipping address is required'),
    billingAddress: z.string().optional().nullable(),
    paymentMethod: z.enum(CHECKOUT_PAYMENT_METHODS),
    notes: z.string().optional(),
    couponCode: z.string().trim().min(1).optional().nullable(),
  }),
});

export const addWishlistSchema = z.object({
  body: z.object({
    product: z.string().min(1, 'Product is required'),
    variant: z.string().optional().nullable(),
  }),
});

export const removeWishlistParamSchema = z.object({
  params: z.object({ productId: z.string().min(1) }),
  query: z.object({ variant: z.string().optional() }),
});

// Preview items carry the cart page's own client-computed unitPrice/total
// (same non-authoritative status the old client-reported `subtotal` had) -
// only real for scope matching (metal/category/etc need a productId either
// way); checkout() re-derives everything from the real order's OrderItems
// and is the only path money actually depends on.
const couponPreviewItem = z.object({
  product: z.string().min(1),
  variant: z.string().optional().nullable(),
  quantity: z.coerce.number().min(1),
  unitPrice: z.coerce.number().min(0),
  total: z.coerce.number().min(0),
});

export const applyCouponSchema = z.object({
  body: z.object({
    code: z.string().trim().min(1, 'Coupon code is required'),
    items: z.array(couponPreviewItem).min(1, 'Cart is empty'),
    subtotal: z.coerce.number().min(0),
    shippingCharge: z.coerce.number().min(0).optional().default(0),
  }),
});

export const verifyPaymentSchema = z.object({
  body: z.object({
    orderId: z.string().min(1),
    razorpayOrderId: z.string().min(1),
    razorpayPaymentId: z.string().min(1),
    razorpaySignature: z.string().min(1),
  }),
});

export const myOrderIdParamSchema = z.object({ params: z.object({ id: z.string() }) });

export const listMyOrdersQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(50).default(20),
    // Comma-separated, e.g. "shipped,partially_shipped,ready_to_ship" - the
    // My Orders status tabs are broader buyer-facing buckets than a single
    // raw lifecycle status (see MyOrdersPage.jsx#STATUS_TABS), so a customer
    // filtering "Shipped" sees every order actually in transit, not just
    // the ones whose status string happens to be exactly "shipped".
    orderStatus: z
      .string()
      .optional()
      .transform((value) => value?.split(',').filter(Boolean))
      .refine((statuses) => !statuses || statuses.every((s) => Object.values(ORDER_STATUSES).includes(s)), {
        message: 'Invalid order status',
      }),
  }),
});

export const updateMyProfileSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1, 'Name is required').optional(),
    phone: z.string().trim().min(1, 'Phone number is required').optional(),
    dateOfBirth: z.coerce.date().optional().nullable(),
    gender: z.enum(Object.values(GENDERS)).optional(),
  }),
});

export const ledgerQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(50).default(20),
  }),
});

export const requestReturnSchema = z.object({
  params: z.object({ id: z.string() }),
  body: z.object({
    items: z
      .array(z.object({ orderItem: z.string().min(1), returnQuantity: z.coerce.number().int().min(1) }))
      .min(1, 'Select at least one item to return'),
    reason: z.string().trim().min(1, 'Please tell us why you are returning this').optional(),
  }),
});

export const trackOrderSchema = z.object({
  body: z.object({
    orderNumber: z.string().trim().min(1, 'Order number is required'),
    phone: z.string().trim().min(4, 'Phone number is required'),
  }),
});

// ---- Support / Issues / Feedback ----
// `context`/`metadata` arrive as a JSON string (multipart form fields are
// always strings - same reasoning as media's own uploadMediaSchema) -
// parsed in storefront.controller.js, never trusted structurally beyond
// "valid JSON or empty".
export const createMyTicketSchema = z.object({
  body: z.object({
    subject: z.string().trim().min(1, 'Subject is required'),
    category: z.enum(TICKET_CATEGORY_VALUES).optional(),
    priority: z.enum(TICKET_PRIORITY_VALUES).optional(),
    context: z.string().optional(),
    message: z.string().trim().optional(),
  }),
});

export const listMyTicketsQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(50).default(20),
    status: z.enum(TICKET_STATUS_VALUES).optional(),
  }),
});

export const ticketIdParamSchema = z.object({ params: z.object({ id: z.string() }) });

export const replyToTicketSchema = z.object({
  params: z.object({ id: z.string() }),
  body: z.object({ content: z.string().trim().min(1, 'Message is required') }),
});

export const createMyIssueSchema = z.object({
  body: z.object({
    category: z.enum(ISSUE_CATEGORY_VALUES),
    subCategory: z.string().trim().optional(),
    entityType: z.string().trim().optional(),
    entityId: z.string().trim().optional(),
    description: z.string().trim().min(1, 'Please describe the issue'),
    metadata: z.string().optional(),
  }),
});

export const listMyIssuesQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(50).default(20),
    status: z.enum(ISSUE_STATUS_VALUES).optional(),
  }),
});

export const issueIdParamSchema = z.object({ params: z.object({ id: z.string() }) });

export const submitFeedbackSchema = z.object({
  body: z.object({
    rating: z.coerce.number().int().min(1).max(5).optional().nullable(),
    category: z.enum(FEEDBACK_CATEGORY_VALUES).optional(),
    message: z.string().trim().min(1, 'Feedback message is required'),
    pageContext: z.string().trim().optional(),
    orderId: z.string().optional().nullable(),
  }),
});
