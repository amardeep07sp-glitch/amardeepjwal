import { ApiError } from '../../utils/ApiError.js';
import { env } from '../../config/env.js';
import { userRepository } from '../auth/auth.repository.js';
import { customerRepository } from '../customer/customer.repository.js';
import { customerService } from '../customer/customer.service.js';
import { addressService } from '../address/address.service.js';
import { orderService } from '../order/order.service.js';
import { orderRepository } from '../order/order.repository.js';
import { orderItemRepository } from '../order/orderItem.repository.js';
import { orderTimelineRepository } from '../order/orderTimeline.repository.js';
import { orderPaymentService } from '../order/orderPayment.service.js';
import { invoiceService } from '../order/invoice.service.js';
import { wishlistService } from '../wishlist/wishlist.service.js';
import { couponService } from '../coupon/coupon.service.js';
import { serializeCouponPreview } from '../coupon/coupon.serializer.js';
import { walletService } from '../customer/wallet.service.js';
import { loyaltyService } from '../customer/loyalty.service.js';
import { customerReferralService } from '../customer/customerReferral.service.js';
import { orderReturnService } from '../order/orderReturn.service.js';
import { reviewService } from '../review/review.service.js';
import { loginLocationService } from '../cip/loginLocation.service.js';
import { supportService } from '../support/support.service.js';
import { serializeTicket, serializeTicketList, serializeTicketMessage, serializeTicketMessageList } from '../support/supportTicket.serializer.js';
import { issueService } from '../issue/issue.service.js';
import { serializeIssue, serializeIssueList } from '../issue/issueReport.serializer.js';
import { feedbackService } from '../feedback/feedback.service.js';
import { serializeFeedback } from '../feedback/feedback.serializer.js';
import { TICKET_SOURCES } from '../support/support.constants.js';
import { ISSUE_SOURCES } from '../issue/issue.constants.js';
import { ORDER_SOURCES, PAYMENT_METHODS, ORDER_STATUSES } from '../order/order.constants.js';
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

// Last 10 digits only - tolerant of +91/spaces/dashes on either side, the
// only real-world way a phone number typed at checkout vs. typed into the
// guest tracker would ever legitimately differ.
const normalizePhone = (value) => (value || '').replace(/\D/g, '').slice(-10);

export const storefrontService = {
  resolveCustomer,

  // Guest order tracking - deliberately NOT behind `protect` (see
  // storefront.routes.js). orderNumber + phone match is the ownership
  // proof, same trust model real storefronts use for guest tracking. A
  // wrong number or unknown order number both return the identical 404 -
  // never confirm "the order number is right but the phone is wrong",
  // which would let someone brute-force a phone number against a known
  // order number. The response itself is intentionally thin (status,
  // items, timeline, city/state) - never the full address/contact PII a
  // logged-in owner's own order-detail page shows.
  async trackOrder({ orderNumber, phone }) {
    const order = await orderRepository.findByOrderNumber(orderNumber.trim());
    const suppliedPhone = normalizePhone(phone);
    const orderPhone = normalizePhone(order?.shippingAddressSnapshot?.phone || order?.customerSnapshot?.phone);

    if (!order || !suppliedPhone || suppliedPhone !== orderPhone) {
      throw new ApiError(404, 'No order found matching that order number and phone number.');
    }

    const [items, timeline] = await Promise.all([
      orderItemRepository.findByOrder(order._id),
      orderTimelineRepository.findByOrder(order._id),
    ]);

    return {
      orderNumber: order.orderNumber,
      orderStatus: order.orderStatus,
      paymentStatus: order.paymentStatus,
      createdAt: order.createdAt,
      grandTotal: order.grandTotal,
      currency: order.currency,
      deliveryCity: order.shippingAddressSnapshot?.city || '',
      deliveryState: order.shippingAddressSnapshot?.state || '',
      items,
      timeline,
    };
  },

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

    // Re-validates the code against THIS order's real, server-priced items
    // (never the client's own claimed cart) - the exact same
    // couponService.validateForCustomer the cart page's preview call used,
    // so a code that passed preview only fails here if something
    // genuinely changed (limit hit meanwhile, coupon paused, scope no
    // longer matches). A failure here leaves the order in draft (harmless
    // orphan, same as any other checkout step that throws before submit/
    // confirm) rather than silently charging the customer full price for
    // a code they applied.
    let appliedCoupon = null;
    if (couponCode) {
      const orderItems = await orderItemRepository.findByOrder(order.id);
      const cartItems = orderItems.map((item) => ({
        productId: item.product,
        variantId: item.variant,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.total,
      }));
      appliedCoupon = await couponService.validateForCustomer(couponCode, customer._id, cartItems, {
        subtotal: order.subtotal,
        shippingCharge: order.shippingCharge,
      });
      order = await orderService.applyCoupon(
        order.id,
        {
          couponCode: appliedCoupon.coupon.code,
          couponDiscount: appliedCoupon.discountAmount,
          promotionSnapshot: {
            couponId: appliedCoupon.coupon._id,
            campaignId: appliedCoupon.coupon.campaignId ?? null,
            code: appliedCoupon.coupon.code,
            discountType: appliedCoupon.coupon.discountType,
            discountValue: appliedCoupon.coupon.discountValue,
            discountBase: appliedCoupon.coupon.discountBase,
            discountAmount: appliedCoupon.discountAmount,
          },
        },
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
      await couponService.recordRedemption(
        appliedCoupon.coupon._id,
        customer._id,
        order.id,
        appliedCoupon.discountAmount,
        appliedCoupon.coupon.discountBase
      );
    }

    if (paymentMethod === PAYMENT_METHODS.COD) {
      const { order: confirmedOrder } = await orderService.getOrderById(order.id);

      // Fraud/risk guard - unset (COD_MAX_ORDER_VALUE) by default, see
      // env.js's own comment on why. The order stays real and confirmed
      // either way (never rolled back here) - it's just left unpaid, same
      // "a real order, just needs payment resolved another way" shape the
      // Razorpay initiation-failure branch below already uses, rather than
      // silently discarding a placed order.
      if (env.COD_MAX_ORDER_VALUE && confirmedOrder.grandTotal > env.COD_MAX_ORDER_VALUE) {
        return {
          order: confirmedOrder,
          items: await orderItemRepository.findByOrder(order.id),
          payment: {
            method: PAYMENT_METHODS.COD,
            status: 'cod_limit_exceeded',
            error: `Cash on Delivery isn't available for orders above ${env.COD_MAX_ORDER_VALUE}. Please contact us to arrange payment for this order.`,
          },
        };
      }

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
  // cart items/subtotal (fine for a preview; never authoritative for
  // money) and returns the same discount shape checkout() itself will
  // recompute server-side from the real order's OrderItems.
  async previewCoupon(user, { code, items, subtotal, shippingCharge }) {
    const customer = await resolveCustomer(user);
    const cartItems = items.map((item) => ({
      productId: item.product,
      variantId: item.variant,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      total: item.total,
    }));
    const result = await couponService.validateForCustomer(code, customer._id, cartItems, {
      subtotal,
      shippingCharge: shippingCharge ?? 0,
    });
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

  // --- Wallet / Loyalty / Referral - read-only here. Both wallet.service.js
  // and loyalty.service.js already guarantee every Customer has a real
  // record (provisioned atomically in the SAME transaction as the Customer
  // itself - customer.service.js#createCustomer), so these never 404 for a
  // real resolved customer. No spend/redeem action is exposed yet - there is
  // no real conversion-rate/redemption-rule configured anywhere in the
  // system, and inventing one here would be exactly the kind of fabricated
  // business rule this app avoids everywhere else.
  async getMyWallet(user) {
    const customer = await resolveCustomer(user);
    return walletService.getWallet(customer._id);
  },

  async getMyWalletLedger(user, { page, limit }) {
    const customer = await resolveCustomer(user);
    return walletService.getLedger(customer._id, { page, limit });
  },

  async getMyLoyalty(user) {
    const customer = await resolveCustomer(user);
    return loyaltyService.getLoyalty(customer._id);
  },

  async getMyLoyaltyLedger(user, { page, limit }) {
    const customer = await resolveCustomer(user);
    return loyaltyService.getLedger(customer._id, { page, limit });
  },

  // The customer's own referral code (already generated for every customer
  // at creation - customer.service.js#createCustomer) plus who they've
  // referred so far and each referral's real reward status.
  async getMyReferrals(user) {
    const customer = await resolveCustomer(user);
    const referrals = await customerReferralService.listForReferrer(customer._id);
    return { referralCode: customer.referralCode, referrals };
  },

  // Self-service return request - reuses the exact same
  // orderReturnService.requestReturn the staff-facing admin panel calls
  // (order/orderReturn.routes.js), so a customer-filed return and a
  // staff-filed one go through identical validation/audit logic. Two
  // things added here that the shared service itself does NOT enforce
  // (confirmed while building this - orderReturn.service.js#requestReturn
  // takes whatever `items` it's handed with no cross-check against the
  // order at all):
  //   1. A real eligibility guard - the goods must have actually been
  //      received before a return can be requested.
  //   2. Every `orderItem` in the request must actually belong to THIS
  //      order, and `returnQuantity` can never exceed what was actually
  //      bought - a customer-supplied id/quantity is never trusted as-is,
  //      same discipline checkout() already applies to prices.
  async requestMyReturn(user, orderId, { items, reason }) {
    const customer = await resolveCustomer(user);
    const { order } = await orderService.getOrderById(orderId);
    if (ownerId(order.customer) !== String(customer._id)) throw new ApiError(404, 'Order not found');

    const receivedStatuses = [ORDER_STATUSES.DELIVERED, ORDER_STATUSES.PARTIALLY_DELIVERED, ORDER_STATUSES.COMPLETED];
    if (!receivedStatuses.includes(order.orderStatus)) {
      throw new ApiError(400, 'This order has not been delivered yet, so it cannot be returned.');
    }

    const orderItems = await orderItemRepository.findByOrder(orderId);
    const orderItemById = new Map(orderItems.map((item) => [String(item._id), item]));
    for (const { orderItem, returnQuantity } of items) {
      const realItem = orderItemById.get(String(orderItem));
      if (!realItem) throw new ApiError(400, 'One of the selected items does not belong to this order.');
      if (returnQuantity > realItem.quantity) {
        throw new ApiError(400, `You can return at most ${realItem.quantity} of "${realItem.productSnapshot?.name ?? 'this item'}".`);
      }
    }

    return orderReturnService.requestReturn(orderId, { items, reason }, user._id);
  },

  async listMyReturns(user, orderId) {
    const customer = await resolveCustomer(user);
    const { order } = await orderService.getOrderById(orderId);
    if (ownerId(order.customer) !== String(customer._id)) throw new ApiError(404, 'Order not found');
    return orderReturnService.listForOrder(orderId);
  },

  async recordLoginLocation(user, { lat, lng }) {
    const customer = await resolveCustomer(user);
    return loginLocationService.recordLogin(customer._id, { lat, lng });
  },

  async submitMyReview(user, productId, data) {
    const customer = await resolveCustomer(user);
    return reviewService.submitMyReview(customer._id, productId, data);
  },

  async getMyReview(user, productId) {
    const customer = await resolveCustomer(user);
    return reviewService.getMyReview(customer._id, productId);
  },

  async deleteMyReview(user, productId) {
    const customer = await resolveCustomer(user);
    return reviewService.deleteMyReview(customer._id, productId);
  },

  async reportMyReview(user, reviewId, { reason, description }) {
    const customer = await resolveCustomer(user);
    return reviewService.reportReview(reviewId, customer._id, { reason, description });
  },

  // --- Support Tickets (Phase 21-23, 28) - `context` arrives already
  // resolved by the frontend's own Context Engine (whatever page/entity
  // the "Get Support" button was clicked from - Phase 50/53), so the
  // customer is never asked to re-type an order/product/payment id the
  // platform already knows. `context.orderId`, if present, is ownership-
  // checked the same way every other order-scoped storefront method is -
  // a customer can attach context about an order, never someone else's.
  async createMyTicket(user, { subject, category, priority, context, message, attachmentFiles }) {
    const customer = await resolveCustomer(user);
    if (context?.orderId) {
      const { order } = await orderService.getOrderById(context.orderId);
      if (ownerId(order.customer) !== String(customer._id)) throw new ApiError(404, 'Order not found');
    }
    const { ticket, isDuplicate } = await supportService.createTicket(
      { customerId: customer._id, subject, category, priority, source: TICKET_SOURCES.CONTEXTUAL, context, message, attachmentFiles },
      user._id
    );
    return { ...serializeTicket(ticket), isDuplicate };
  },

  async listMyTickets(user, query) {
    const customer = await resolveCustomer(user);
    const { items, meta } = await supportService.listMyTickets(customer._id, query);
    return { items: serializeTicketList(items), meta };
  },

  async getMyTicket(user, ticketId) {
    const customer = await resolveCustomer(user);
    const ticket = await supportService.getMyTicket(customer._id, ticketId);
    const messages = await supportService.listMessages(ticket._id, { includeInternal: false });
    return { ticket: serializeTicket(ticket), messages: serializeTicketMessageList(messages) };
  },

  async replyToMyTicket(user, ticketId, { content, attachmentFiles }) {
    const customer = await resolveCustomer(user);
    const message = await supportService.addMyMessage(customer._id, ticketId, { content, attachmentFiles }, user._id);
    return serializeTicketMessage(message);
  },

  // --- Issue Reports (Phase 6-19, 20) - same context-auto-attach
  // discipline as tickets above.
  async createMyIssue(user, { category, subCategory, entityType, entityId, description, metadata, attachmentFiles }) {
    const customer = await resolveCustomer(user);
    const { issue, isDuplicate } = await issueService.createIssue(
      { reporterId: customer._id, category, subCategory, entityType, entityId, description, metadata, source: ISSUE_SOURCES.CONTEXTUAL, attachmentFiles },
      user._id
    );
    return { ...serializeIssue(issue), isDuplicate };
  },

  async listMyIssues(user, query) {
    const customer = await resolveCustomer(user);
    const { items, meta } = await issueService.listMyIssues(customer._id, query);
    return { items: serializeIssueList(items), meta };
  },

  async getMyIssue(user, issueId) {
    const customer = await resolveCustomer(user);
    const issue = await issueService.getMyIssue(customer._id, issueId);
    return serializeIssue(issue);
  },

  // --- Feedback (Phase 34) - a one-way opinion, no lifecycle to read back.
  async submitMyFeedback(user, { rating, category, message, pageContext, orderId }) {
    const customer = await resolveCustomer(user);
    const feedback = await feedbackService.submitFeedback({ customerId: customer._id, rating, category, message, pageContext, orderId });
    return serializeFeedback(feedback);
  },
};
