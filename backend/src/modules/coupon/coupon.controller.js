import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { couponService } from './coupon.service.js';
import { serializeCoupon, serializeCouponList } from './coupon.serializer.js';
import { couponRedemptionRepository } from './couponRedemption.repository.js';
import { serializeRedemptionList } from './couponRedemption.serializer.js';

export const listCoupons = asyncHandler(async (req, res) => {
  const { items, meta } = await couponService.listCoupons(req.query);
  res.status(200).json(new ApiResponse(200, { items: serializeCouponList(items), meta }, 'Coupons fetched successfully'));
});

export const getCouponById = asyncHandler(async (req, res) => {
  const coupon = await couponService.getCouponById(req.params.id);
  res.status(200).json(new ApiResponse(200, serializeCoupon(coupon), 'Coupon fetched successfully'));
});

export const createCoupon = asyncHandler(async (req, res) => {
  const coupon = await couponService.createCoupon(req.body, req.user._id);
  res.status(201).json(new ApiResponse(201, serializeCoupon(coupon), 'Coupon created successfully'));
});

export const updateCoupon = asyncHandler(async (req, res) => {
  const coupon = await couponService.updateCoupon(req.params.id, req.body, req.user._id);
  res.status(200).json(new ApiResponse(200, serializeCoupon(coupon), 'Coupon updated successfully'));
});

export const deleteCoupon = asyncHandler(async (req, res) => {
  await couponService.deleteCoupon(req.params.id);
  res.status(200).json(new ApiResponse(200, null, 'Coupon deleted successfully'));
});

export const listRedemptions = asyncHandler(async (req, res) => {
  const { page, limit, ...filters } = req.query;
  const { items, total } = await couponRedemptionRepository.findPaginated({ page, limit, ...filters });
  const meta = { page, limit, totalItems: total, totalPages: Math.max(1, Math.ceil(total / limit)) };
  res.status(200).json(new ApiResponse(200, { items: serializeRedemptionList(items), meta }, 'Redemptions fetched successfully'));
});

export const getCouponAnalytics = asyncHandler(async (req, res) => {
  const summary = await couponRedemptionRepository.getSummaryByCoupon(req.params.id);
  res.status(200).json(new ApiResponse(200, summary, 'Coupon analytics fetched successfully'));
});
