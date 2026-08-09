import { ApiError } from '../../utils/ApiError.js';
import { userRepository } from '../auth/auth.repository.js';
import { customerRepository } from '../customer/customer.repository.js';
import { customerService } from '../customer/customer.service.js';
import { addressService } from '../address/address.service.js';
import { orderService } from '../order/order.service.js';
import { orderPaymentService } from '../order/orderPayment.service.js';
import { invoiceService } from '../order/invoice.service.js';
import { wishlistService } from '../wishlist/wishlist.service.js';
import { couponService } from '../coupon/coupon.service.js';
import { serializeCouponPreview } from '../coupon/coupon.serializer.js';
import { ORDER_SOURCES, PAYMENT_METHODS } from '../order/order.constants.js';
import { CUSTOMER_STATUSES, CUSTOMER_TYPES, LEAD_SOURCES } from '../customer/customer.constants.js';

// The one door a logged-in shopper's own data goes through - every method
// here takes the authenticated `user` (req.user from the `protect`
// middleware, no role restriction) and resolves+scopes to THEIR OWN
// Customer/Address/Order records before ever reading or writing anything.
// Nothing here is a parallel implementation of cart/checkout/address logic
// - it's a thin, ownership-checked layer over the real
// customerService/addressService/orderService/orderPaymentService that
// already exist and are already tested.

// Same auto-provision-or-link logic as auth.service.js#register/login (a
// pre-existing user from before that logic shipped, or a user whose
// Customer link is otherwise missing, still gets one lazily here rather
// than 500ing on their first cart/checkout call).
async function resolveCustomer(user) {
  const existing = await customerRepository.findByUser(user._id);
  if (existing) return existing;

  const existingByContact = user.email
    ? await customerRepository.findByEmail(user.email)
    : user.phone
      ? await customerRepository.findByPhone(user.phone)
      : null;

  if (existingByContact) {
    if (!existingByContact.user) {
      existingByContact.user = user._id;
      await existingByContact.save();
    }
    return existingByContact;
  }

  const [firstName, ...rest] = (user.name || 'Customer').trim().split(/\s+/);
  return customerService.createCustomer(
    {
      firstName: firstName || 'Customer',
      lastName: rest.join(' '),
      email: user.email || undefined,
      phone: user.phone || undefined,
      status: CUSTOMER_STATUSES.ACTIVE,
      customerType: CUSTOMER_TYPES.RETAIL,
      leadSource: LEAD_SOURCES.WEBSITE,
    },
    user._id
  );
}

const ownerId = (ref) => String(ref?._id ?? ref);

export const storefrontService = {
  resolveCustomer,

  async listMyAddresses(user) {
    const customer = await resolveCustomer(user);
    return addressService.listForCustomer(customer._id);
  },

  async createMyAddress(user, data) {
    const customer = await resolveCustomer(user);
    return addressService.createAddress({ ...data, customer: customer._id });
  },

  async updateMyAddress(user, addressId, data) {
    const customer = await resolveCustomer(user);
    const existing = await addressService.getById(addressId);
    if (ownerId(existing.customer) !== String(customer._id)) throw new ApiError(404, 'Address not found');
    return addressService.updateAddress(addressId, data);
  },

  async deleteMyAddress(user, addressId) {
    const customer = await resolveCustomer(user);
    const existing = await addressService.getById(addressId);
    if (ownerId(existing.customer) !== String(customer._id)) throw new ApiError(404, 'Address not found');
    return addressService.deleteAddress(addressId);
  },

  // Cart -> real Order in one call: createOrder (draft, server-priced from
  // live product data - never trusts a price the client sent) -> submitOrder
  // -> confirmOrder (the real stock-reservation guard, order.service.js -
  // throws if any line item is actually out of stock). A COD order is fully
  // placed at the end of this; a Razorpay order still needs its payment
  // verified (see verifyPayment below) before it's truly paid, same as any
  // real gateway-backed checkout.
  async checkout(user, { items, shippingAddress, billingAddress, paymentMethod, notes, couponCode }) {
    const customer = await resolveCustomer(user);

    const shipAddr = await addressService.getById(shippingAddress);
    if (ownerId(shipAddr.customer) !== String(customer._id)) throw new ApiError(403, 'Invalid shipping address');
    if (billingAddress) {
      const billAddr = await addressService.getById(billingAddress);
      if (ownerId(billAddr.customer) !== String(customer._id)) throw new ApiError(403, 'Invalid billing address');
    }

    let order = await orderService.createOrder(
      {
        customer: customer._id,
        items,
        shippingAddress,
        billingAddress: billingAddress || shippingAddress,
        source: ORDER_SOURCES.WEBSITE,
        notes,
      },
      user._id
    );

    // Re-validates the code against THIS order's real, server-computed
    // subtotal (never the client's own claimed cart total) - the exact
    // same couponService.validateForCustomer the cart page's preview call
    // used, so a code that passed preview only fails here if something
    // genuinely changed (limit hit meanwhile, coupon deactivated). A
    // failure here leaves the order in draft (harmless orphan, same as any
    // other checkout step that throws before submit/confirm) rather than
    // silently charging the customer full price for a code they applied.
    let appliedCoupon = null;
    if (couponCode) {
      appliedCoupon = await couponService.validateForCustomer(couponCode, customer._id, order.subtotal);
      order = await orderService.applyCoupon(
        order.id,
        { couponCode: appliedCoupon.coupon.code, couponDiscount: appliedCoupon.discountAmount },
        user._id
      );
    }

    await orderService.submitOrder(order.id, user._id);
    // Real stock check happens inside confirmOrder - an insufficient-stock
    // ApiError propagates straight to the checkout response; the order
    // itself is left in 'pending' (visible to admin, never silently
    // dropped), not force-confirmed over a stock guard that just failed.
    await orderService.confirmOrder(order.id, { userId: user._id });

    if (appliedCoupon) {
      await couponService.recordRedemption(appliedCoupon.coupon._id, customer._id, order.id, appliedCoupon.discountAmount);
    }

    if (paymentMethod === PAYMENT_METHODS.COD) {
      const { order: confirmedOrder } = await orderService.getOrderById(order.id);
      await orderPaymentService.recordManualPayment(order.id, { method: PAYMENT_METHODS.COD, amount: confirmedOrder.grandTotal }, user._id);
      const { order: finalOrder, items: orderItems } = await orderService.getOrderById(order.id);
      return { order: finalOrder, items: orderItems, payment: { method: PAYMENT_METHODS.COD, status: 'confirmed' } };
    }

    // Razorpay - the order already exists and is confirmed (stock
    // reserved) by this point, same as the COD branch above. If gateway
    // initiation itself fails (most commonly: not configured on this
    // server, razorpay.service.js), that must NOT surface as an opaque
    // "checkout failed" - the order is real and already placed, just
    // unpaid, so the response still returns it with the actual gateway
    // error attached. Losing track of a real order number here because a
    // downstream call threw would be exactly the kind of silent gap this
    // flow is built to never have.
    const { order: pendingOrder, items: orderItems } = await orderService.getOrderById(order.id);
    try {
      const razorpay = await orderPaymentService.initiateRazorpayPayment(order.id, user._id);
      return { order: pendingOrder, items: orderItems, payment: { method: PAYMENT_METHODS.RAZORPAY, ...razorpay } };
    } catch (err) {
      return {
        order: pendingOrder,
        items: orderItems,
        payment: { method: PAYMENT_METHODS.RAZORPAY, status: 'initiation_failed', error: err.message },
      };
    }
  },

  async verifyPayment(user, { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature }) {
    const customer = await resolveCustomer(user);
    const { order } = await orderService.getOrderById(orderId);
    if (ownerId(order.customer) !== String(customer._id)) throw new ApiError(404, 'Order not found');

    await orderPaymentService.verifyRazorpayPayment({ razorpayOrderId, razorpayPaymentId, razorpaySignature }, user._id);
    const { order: paidOrder, items } = await orderService.getOrderById(orderId);
    return { order: paidOrder, items };
  },

  async listMyOrders(user, { page, limit, orderStatus }) {
    const customer = await resolveCustomer(user);
    return orderService.listOrders({ page, limit, customer: customer._id, orderStatus, sortBy: 'createdAt', sortOrder: 'desc' });
  },

  async getMyOrder(user, orderId) {
    const customer = await resolveCustomer(user);
    const { order, items } = await orderService.getOrderById(orderId);
    if (ownerId(order.customer) !== String(customer._id)) throw new ApiError(404, 'Order not found');
    return { order, items };
  },

  // Same real PDF the admin panel's own invoice download uses
  // (invoice.service.js#generateInvoicePdf) - this is only the
  // ownership-checked door to it, never a second invoice implementation.
  async downloadMyInvoice(user, orderId) {
    const customer = await resolveCustomer(user);
    const { order } = await orderService.getOrderById(orderId);
    if (ownerId(order.customer) !== String(customer._id)) throw new ApiError(404, 'Order not found');
    return invoiceService.generateInvoicePdf(orderId);
  },

  async listMyWishlist(user) {
    const customer = await resolveCustomer(user);
    return wishlistService.listForCustomer(customer._id);
  },

  async addToMyWishlist(user, { product, variant }) {
    const customer = await resolveCustomer(user);
    return wishlistService.addItem(customer._id, { product, variant });
  },

  async removeFromMyWishlist(user, productId, variantId) {
    const customer = await resolveCustomer(user);
    return wishlistService.removeItem(customer._id, productId, variantId ?? null);
  },

  // Cart page's "Apply" preview - validates against the client-reported
  // subtotal (fine for a preview; never authoritative for money) and
  // returns the same discount shape checkout() itself will recompute
  // server-side from the real order subtotal.
  async previewCoupon(user, { code, subtotal }) {
    const customer = await resolveCustomer(user);
    const result = await couponService.validateForCustomer(code, customer._id, subtotal);
    return serializeCouponPreview(result);
  },

  // Profile is a merge of two real records - name/email/phone live on the
  // auth User (login identity), dateOfBirth/gender live on the CRM
  // Customer (see resolveCustomer's header comment for why they're
  // separate collections). A shopper only ever sees/edits their own slice
  // of each, never the other CRM fields (segments, tags, lead source, etc.)
  // that exist for staff use only.
  async getMyProfile(user) {
    const customer = await resolveCustomer(user);
    return {
      name: user.name,
      email: user.email,
      phone: user.phone,
      dateOfBirth: customer.dateOfBirth,
      gender: customer.gender,
    };
  },

  async updateMyProfile(user, { name, phone, dateOfBirth, gender }) {
    const customer = await resolveCustomer(user);

    const userUpdates = {};
    if (name !== undefined) userUpdates.name = name;
    if (phone !== undefined) userUpdates.phone = phone;
    const updatedUser = Object.keys(userUpdates).length ? await userRepository.updateById(user._id, userUpdates) : user;

    const customerUpdates = {};
    if (dateOfBirth !== undefined) customerUpdates.dateOfBirth = dateOfBirth;
    if (gender !== undefined) customerUpdates.gender = gender;
    // Keep the CRM record's own phone in sync too - it's what order
    // snapshots and staff-facing views read, not the auth User.
    if (phone !== undefined) customerUpdates.phone = phone;
    const updatedCustomer = Object.keys(customerUpdates).length
      ? await customerRepository.updateById(customer._id, customerUpdates)
      : customer;

    return {
      name: updatedUser.name,
      email: updatedUser.email,
      phone: updatedUser.phone,
      dateOfBirth: updatedCustomer.dateOfBirth,
      gender: updatedCustomer.gender,
    };
  },
};
