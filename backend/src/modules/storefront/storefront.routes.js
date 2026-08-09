import { Router } from 'express';
import { protect } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
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
} from './storefront.validation.js';
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
} from './storefront.controller.js';

// A logged-in shopper's own data - `protect` alone (no `authorize`), unlike
// every other route these same underlying services back (order/address
// modules are otherwise staff-only, see storefront.service.js's header
// comment) - any authenticated customer, never a specific role beyond
// "is who they say they are", and every handler scopes to THEIR OWN
// Customer record, never an id the client supplies.
const router = Router();
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

router.get('/wishlist', listMyWishlist);
router.post('/wishlist', validate(addWishlistSchema), addToMyWishlist);
router.delete('/wishlist/:productId', validate(removeWishlistParamSchema), removeFromMyWishlist);

router.get('/profile', getMyProfile);
router.put('/profile', validate(updateMyProfileSchema), updateMyProfile);

export default router;
