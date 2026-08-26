import { Router } from 'express';
import { protect } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { authLimiter, supportCreateLimiter } from '../../middlewares/rateLimiter.middleware.js';
import {
  createMyAddressSchema,
  updateMyAddressSchema,
  addressIdParamSchema,
  checkoutSchema,
  verifyPaymentSchema,
  listMyOrdersQuerySchema,
  myOrderIdParamSchema,
  addWishlistSchema,
  removeWishlistParamSchema,
  applyCouponSchema,
  updateMyProfileSchema,
  ledgerQuerySchema,
  requestReturnSchema,
  trackOrderSchema,
  createMyTicketSchema,
  listMyTicketsQuerySchema,
  ticketIdParamSchema,
  replyToTicketSchema,
  createMyIssueSchema,
  listMyIssuesQuerySchema,
  issueIdParamSchema,
  submitFeedbackSchema,
  recordLoginLocationSchema,
} from './storefront.validation.js';
import { submitReviewSchema, productIdParamSchema, reportReviewSchema } from '../review/review.validation.js';
import { handleAttachmentsUpload } from '../media/media.upload.middleware.js';
import {
  listMyAddresses,
  createMyAddress,
  updateMyAddress,
  deleteMyAddress,
  checkout,
  verifyPayment,
  listMyOrders,
  getMyOrder,
  listMyWishlist,
  addToMyWishlist,
  removeFromMyWishlist,
  applyCoupon,
  getMyProfile,
  updateMyProfile,
  downloadMyInvoice,
  getMyWallet,
  getMyWalletLedger,
  getMyLoyalty,
  getMyLoyaltyLedger,
  getMyReferrals,
  requestMyReturn,
  listMyReturns,
  trackOrder,
  recordLoginLocation,
  submitMyReview,
  getMyReview,
  deleteMyReview,
  reportMyReview,
  createMyTicket,
  listMyTickets,
  getMyTicket,
  replyToMyTicket,
  createMyIssue,
  listMyIssues,
  getMyIssue,
  submitMyFeedback,
} from './storefront.controller.js';

const router = Router();

// Guest order tracking - the one deliberately public route in this module,
// so it's registered BEFORE `router.use(protect)` below rather than
// carved out with an exception inside a protected route. Same
// `authLimiter` login/register use (20 req/15min) - an order number +
// phone pair is a guessable-credential pattern exactly like a password,
// so it gets the same brute-force ceiling.
router.post('/track-order', authLimiter, validate(trackOrderSchema), trackOrder);

// A logged-in shopper's own data - `protect` alone (no `authorize`), unlike
// every other route these same underlying services back (order/address
// modules are otherwise staff-only, see storefront.service.js's header
// comment) - any authenticated customer, never a specific role beyond
// "is who they say they are", and every handler scopes to THEIR OWN
// Customer record, never an id the client supplies.
router.use(protect);

router.get('/addresses', listMyAddresses);
router.post('/addresses', validate(createMyAddressSchema), createMyAddress);
router.put('/addresses/:id', validate(updateMyAddressSchema), updateMyAddress);
router.delete('/addresses/:id', validate(addressIdParamSchema), deleteMyAddress);

router.post('/checkout', validate(checkoutSchema), checkout);
router.post('/payments/razorpay/verify', validate(verifyPaymentSchema), verifyPayment);
router.post('/coupons/apply', validate(applyCouponSchema), applyCoupon);

router.get('/orders', validate(listMyOrdersQuerySchema), listMyOrders);
router.get('/orders/:id', validate(myOrderIdParamSchema), getMyOrder);
router.get('/orders/:id/invoice', validate(myOrderIdParamSchema), downloadMyInvoice);
router.get('/orders/:id/returns', validate(myOrderIdParamSchema), listMyReturns);
router.post('/orders/:id/returns', validate(requestReturnSchema), requestMyReturn);

router.get('/wishlist', listMyWishlist);
router.post('/wishlist', validate(addWishlistSchema), addToMyWishlist);
router.delete('/wishlist/:productId', validate(removeWishlistParamSchema), removeFromMyWishlist);

router.post('/login-location', validate(recordLoginLocationSchema), recordLoginLocation);

router.get('/profile', getMyProfile);
router.put('/profile', validate(updateMyProfileSchema), updateMyProfile);

router.get('/wallet', getMyWallet);
router.get('/wallet/ledger', validate(ledgerQuerySchema), getMyWalletLedger);
router.get('/loyalty', getMyLoyalty);
router.get('/loyalty/ledger', validate(ledgerQuerySchema), getMyLoyaltyLedger);
router.get('/referrals', getMyReferrals);

router.get('/products/:productId/review', validate(productIdParamSchema), getMyReview);
router.post('/products/:productId/review', handleAttachmentsUpload, validate(submitReviewSchema), submitMyReview);
router.delete('/products/:productId/review', validate(productIdParamSchema), deleteMyReview);

// Report a review (Phase 18) - goes straight to Review Moderation, not the
// general issue-reporting pipeline below.
router.post('/reviews/:reviewId/report', supportCreateLimiter, validate(reportReviewSchema), reportMyReview);

// Support tickets - `handleAttachmentsUpload` is a no-op when the request
// carries no files (see media.upload.middleware.js), so plain JSON-only
// submissions from these same endpoints still work. `supportCreateLimiter`
// only on the write actions (new ticket / new message) - reads are already
// covered by the general apiLimiter, no need to double-throttle them.
router.get('/support/tickets', validate(listMyTicketsQuerySchema), listMyTickets);
router.post('/support/tickets', supportCreateLimiter, handleAttachmentsUpload, validate(createMyTicketSchema), createMyTicket);
router.get('/support/tickets/:id', validate(ticketIdParamSchema), getMyTicket);
router.post('/support/tickets/:id/messages', supportCreateLimiter, handleAttachmentsUpload, validate(replyToTicketSchema), replyToMyTicket);

// Contextual issue reports
router.get('/issues', validate(listMyIssuesQuerySchema), listMyIssues);
router.post('/issues', supportCreateLimiter, handleAttachmentsUpload, validate(createMyIssueSchema), createMyIssue);
router.get('/issues/:id', validate(issueIdParamSchema), getMyIssue);

// Feedback
router.post('/feedback', supportCreateLimiter, validate(submitFeedbackSchema), submitMyFeedback);

export default router;
