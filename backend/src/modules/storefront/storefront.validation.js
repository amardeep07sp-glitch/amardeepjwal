import { z } from 'zod';
import { ADDRESS_TYPES, GENDERS } from '../customer/customer.constants.js';
import { PAYMENT_METHODS, ORDER_STATUSES } from '../order/order.constants.js';

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

export const applyCouponSchema = z.object({
  body: z.object({
    code: z.string().trim().min(1, 'Coupon code is required'),
    subtotal: z.coerce.number().min(0),
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
    orderStatus: z.enum(Object.values(ORDER_STATUSES)).optional(),
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
