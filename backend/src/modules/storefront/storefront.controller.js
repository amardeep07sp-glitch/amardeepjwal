import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { storefrontService } from './storefront.service.js';
import { serializeAddress, serializeAddressList } from '../address/address.serializer.js';
import { serializeOrder, serializeOrderList } from '../order/order.serializer.js';
import { serializeOrderItemList } from '../order/orderItem.serializer.js';

// Same serializers the admin-facing address/order controllers already use
// (address.serializer.js, order.serializer.js) - a shopper's own cart/
// checkout/order-history reads the exact same `id`-not-`_id` shape every
// other public/admin endpoint in this API already returns, not a
// second convention invented for this one module.

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
