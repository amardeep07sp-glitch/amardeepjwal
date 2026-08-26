import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { storefrontService } from './storefront.service.js';
import { serializeAddress, serializeAddressList } from '../address/address.serializer.js';
import { serializeOrder, serializeOrderList } from '../order/order.serializer.js';
import { serializeOrderItemList } from '../order/orderItem.serializer.js';
import { serializeWallet, serializeWalletLedgerList } from '../customer/wallet.serializer.js';
import { serializeLoyalty, serializeLoyaltyLedgerList } from '../customer/loyalty.serializer.js';
import { serializeReferralList } from '../customer/customerReferral.serializer.js';
import { serializeOrderReturn, serializeOrderReturnList } from '../order/orderReturn.serializer.js';
import { serializeTimelineList } from '../order/orderTimeline.serializer.js';
import { serializeReview } from '../review/review.serializer.js';

// Same serializers the admin-facing address/order controllers already use
// (address.serializer.js, order.serializer.js) - a shopper's own cart/
// checkout/order-history reads the exact same `id`-not-`_id` shape every
// other public/admin endpoint in this API already returns, not a
// second convention invented for this one module.

export const trackOrder = asyncHandler(async (req, res) => {
  const result = await storefrontService.trackOrder(req.body);
  res.status(200).json(
    new ApiResponse(
      200,
      { ...result, items: serializeOrderItemList(result.items), timeline: serializeTimelineList(result.timeline) },
      'Order found'
    )
  );
});

export const listMyAddresses = asyncHandler(async (req, res) => {
  const addresses = await storefrontService.listMyAddresses(req.user);
  res.status(200).json(new ApiResponse(200, serializeAddressList(addresses), 'Addresses fetched successfully'));
});

export const createMyAddress = asyncHandler(async (req, res) => {
  const address = await storefrontService.createMyAddress(req.user, req.body);
  res.status(201).json(new ApiResponse(201, serializeAddress(address), 'Address added successfully'));
});

export const updateMyAddress = asyncHandler(async (req, res) => {
  const address = await storefrontService.updateMyAddress(req.user, req.params.id, req.body);
  res.status(200).json(new ApiResponse(200, serializeAddress(address), 'Address updated successfully'));
});

export const deleteMyAddress = asyncHandler(async (req, res) => {
  await storefrontService.deleteMyAddress(req.user, req.params.id);
  res.status(200).json(new ApiResponse(200, null, 'Address deleted successfully'));
});

export const checkout = asyncHandler(async (req, res) => {
  const { order, items, payment } = await storefrontService.checkout(req.user, req.body);
  res.status(201).json(
    new ApiResponse(201, { order: serializeOrder(order), items: serializeOrderItemList(items), payment }, 'Order placed successfully')
  );
});

export const verifyPayment = asyncHandler(async (req, res) => {
  const { order, items } = await storefrontService.verifyPayment(req.user, req.body);
  res
    .status(200)
    .json(new ApiResponse(200, { order: serializeOrder(order), items: serializeOrderItemList(items) }, 'Payment verified successfully'));
});

export const listMyOrders = asyncHandler(async (req, res) => {
  const { items, meta } = await storefrontService.listMyOrders(req.user, req.query);
  res.status(200).json(new ApiResponse(200, { items: serializeOrderList(items), meta }, 'Orders fetched successfully'));
});

export const getMyOrder = asyncHandler(async (req, res) => {
  const { order, items } = await storefrontService.getMyOrder(req.user, req.params.id);
  res.status(200).json(new ApiResponse(200, { order: serializeOrder(order), items: serializeOrderItemList(items) }, 'Order fetched successfully'));
});

export const downloadMyInvoice = asyncHandler(async (req, res) => {
  const pdfBuffer = await storefrontService.downloadMyInvoice(req.user, req.params.id);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="invoice-${req.params.id}.pdf"`);
  res.send(pdfBuffer);
});

export const listMyWishlist = asyncHandler(async (req, res) => {
  const items = await storefrontService.listMyWishlist(req.user);
  res.status(200).json(new ApiResponse(200, items, 'Wishlist fetched successfully'));
});

export const addToMyWishlist = asyncHandler(async (req, res) => {
  const item = await storefrontService.addToMyWishlist(req.user, req.body);
  res.status(201).json(new ApiResponse(201, { id: item._id, product: item.product, variant: item.variant }, 'Added to wishlist'));
});

export const removeFromMyWishlist = asyncHandler(async (req, res) => {
  await storefrontService.removeFromMyWishlist(req.user, req.params.productId, req.query.variant);
  res.status(200).json(new ApiResponse(200, null, 'Removed from wishlist'));
});

export const applyCoupon = asyncHandler(async (req, res) => {
  const preview = await storefrontService.previewCoupon(req.user, req.body);
  res.status(200).json(new ApiResponse(200, preview, 'Coupon applied successfully'));
});

export const getMyProfile = asyncHandler(async (req, res) => {
  const profile = await storefrontService.getMyProfile(req.user);
  res.status(200).json(new ApiResponse(200, profile, 'Profile fetched successfully'));
});

export const updateMyProfile = asyncHandler(async (req, res) => {
  const profile = await storefrontService.updateMyProfile(req.user, req.body);
  res.status(200).json(new ApiResponse(200, profile, 'Profile updated successfully'));
});

export const getMyWallet = asyncHandler(async (req, res) => {
  const wallet = await storefrontService.getMyWallet(req.user);
  res.status(200).json(new ApiResponse(200, serializeWallet(wallet), 'Wallet fetched successfully'));
});

export const getMyWalletLedger = asyncHandler(async (req, res) => {
  const { items, meta } = await storefrontService.getMyWalletLedger(req.user, req.query);
  res.status(200).json(new ApiResponse(200, { items: serializeWalletLedgerList(items), meta }, 'Wallet history fetched successfully'));
});

export const getMyLoyalty = asyncHandler(async (req, res) => {
  const loyalty = await storefrontService.getMyLoyalty(req.user);
  res.status(200).json(new ApiResponse(200, serializeLoyalty(loyalty), 'Loyalty fetched successfully'));
});

export const getMyLoyaltyLedger = asyncHandler(async (req, res) => {
  const { items, meta } = await storefrontService.getMyLoyaltyLedger(req.user, req.query);
  res.status(200).json(new ApiResponse(200, { items: serializeLoyaltyLedgerList(items), meta }, 'Loyalty history fetched successfully'));
});

export const getMyReferrals = asyncHandler(async (req, res) => {
  const { referralCode, referrals } = await storefrontService.getMyReferrals(req.user);
  res.status(200).json(new ApiResponse(200, { referralCode, referrals: serializeReferralList(referrals) }, 'Referrals fetched successfully'));
});

export const requestMyReturn = asyncHandler(async (req, res) => {
  const orderReturn = await storefrontService.requestMyReturn(req.user, req.params.id, req.body);
  res.status(201).json(new ApiResponse(201, serializeOrderReturn(orderReturn), 'Return request submitted successfully'));
});

export const listMyReturns = asyncHandler(async (req, res) => {
  const returns = await storefrontService.listMyReturns(req.user, req.params.id);
  res.status(200).json(new ApiResponse(200, serializeOrderReturnList(returns), 'Returns fetched successfully'));
});

export const recordLoginLocation = asyncHandler(async (req, res) => {
  await storefrontService.recordLoginLocation(req.user, req.body);
  res.status(200).json(new ApiResponse(200, null, 'Location recorded'));
});

export const submitMyReview = asyncHandler(async (req, res) => {
  const review = await storefrontService.submitMyReview(req.user, req.params.productId, { ...req.body, attachmentFiles: req.files });
  res.status(201).json(new ApiResponse(201, serializeReview(review), 'Review submitted - it will appear once approved'));
});

export const getMyReview = asyncHandler(async (req, res) => {
  const review = await storefrontService.getMyReview(req.user, req.params.productId);
  res.status(200).json(new ApiResponse(200, review ? serializeReview(review) : null, 'Review fetched successfully'));
});

export const deleteMyReview = asyncHandler(async (req, res) => {
  await storefrontService.deleteMyReview(req.user, req.params.productId);
  res.status(200).json(new ApiResponse(200, null, 'Review deleted successfully'));
});

export const reportMyReview = asyncHandler(async (req, res) => {
  await storefrontService.reportMyReview(req.user, req.params.reviewId, req.body);
  res.status(201).json(new ApiResponse(201, null, "Thanks - we've flagged this review for moderation"));
});

// A malformed `context`/`metadata` JSON string (or none at all) just means
// "no context" - it never fails the whole submission, since the
// description/attachments the customer actually provided are still valid
// and useful on their own.
function parseJsonField(value) {
  if (!value) return {};
  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
}

export const createMyTicket = asyncHandler(async (req, res) => {
  const ticket = await storefrontService.createMyTicket(req.user, { ...req.body, context: parseJsonField(req.body.context), attachmentFiles: req.files });
  const message = ticket.isDuplicate ? 'You already have an open ticket for this - showing that one' : 'Support ticket created successfully';
  res.status(201).json(new ApiResponse(201, ticket, message));
});

export const listMyTickets = asyncHandler(async (req, res) => {
  const { items, meta } = await storefrontService.listMyTickets(req.user, req.query);
  res.status(200).json(new ApiResponse(200, { items, meta }, 'Tickets fetched successfully'));
});

export const getMyTicket = asyncHandler(async (req, res) => {
  const result = await storefrontService.getMyTicket(req.user, req.params.id);
  res.status(200).json(new ApiResponse(200, result, 'Ticket fetched successfully'));
});

export const replyToMyTicket = asyncHandler(async (req, res) => {
  const message = await storefrontService.replyToMyTicket(req.user, req.params.id, { content: req.body.content, attachmentFiles: req.files });
  res.status(201).json(new ApiResponse(201, message, 'Reply sent successfully'));
});

export const createMyIssue = asyncHandler(async (req, res) => {
  const issue = await storefrontService.createMyIssue(req.user, { ...req.body, metadata: parseJsonField(req.body.metadata), attachmentFiles: req.files });
  const message = issue.isDuplicate ? "You've already reported this - we're already on it" : 'Issue reported successfully';
  res.status(201).json(new ApiResponse(201, issue, message));
});

export const listMyIssues = asyncHandler(async (req, res) => {
  const { items, meta } = await storefrontService.listMyIssues(req.user, req.query);
  res.status(200).json(new ApiResponse(200, { items, meta }, 'Issue reports fetched successfully'));
});

export const getMyIssue = asyncHandler(async (req, res) => {
  const issue = await storefrontService.getMyIssue(req.user, req.params.id);
  res.status(200).json(new ApiResponse(200, issue, 'Issue report fetched successfully'));
});

export const submitMyFeedback = asyncHandler(async (req, res) => {
  const feedback = await storefrontService.submitMyFeedback(req.user, req.body);
  res.status(201).json(new ApiResponse(201, feedback, 'Thanks for your feedback'));
});
