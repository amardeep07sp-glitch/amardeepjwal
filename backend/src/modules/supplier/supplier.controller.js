import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { supplierService } from './supplier.service.js';
import { serializeSupplier, serializeSupplierList } from './supplier.serializer.js';
import { serializeSupplierTimelineList } from './supplierTimeline.serializer.js';
import { serializeSupplierActivityList } from './supplierActivity.serializer.js';

export const listSuppliers = asyncHandler(async (req, res) => {
  const result = await supplierService.listSuppliers(req.query);
  res.status(200).json(
    new ApiResponse(200, { items: serializeSupplierList(result.items), meta: result.meta }, 'Suppliers fetched successfully')
  );
});

export const getSupplierById = asyncHandler(async (req, res) => {
  const supplier = await supplierService.getSupplierById(req.params.id);
  res.status(200).json(new ApiResponse(200, serializeSupplier(supplier), 'Supplier fetched successfully'));
});

export const getSupplierTimeline = asyncHandler(async (req, res) => {
  const timeline = await supplierService.getTimeline(req.params.id);
  res.status(200).json(new ApiResponse(200, serializeSupplierTimelineList(timeline), 'Supplier timeline fetched successfully'));
});

export const getSupplierActivity = asyncHandler(async (req, res) => {
  const activity = await supplierService.getActivity(req.params.id);
  res.status(200).json(new ApiResponse(200, serializeSupplierActivityList(activity), 'Supplier activity fetched successfully'));
});

export const createSupplier = asyncHandler(async (req, res) => {
  const supplier = await supplierService.createSupplier(req.body, req.user._id);
  res.status(201).json(new ApiResponse(201, serializeSupplier(supplier), 'Supplier created successfully'));
});

export const updateSupplier = asyncHandler(async (req, res) => {
  const supplier = await supplierService.updateSupplier(req.params.id, req.body, req.user._id);
  res.status(200).json(new ApiResponse(200, serializeSupplier(supplier), 'Supplier updated successfully'));
});

export const deleteSupplier = asyncHandler(async (req, res) => {
  await supplierService.deleteSupplier(req.params.id);
  res.status(200).json(new ApiResponse(200, null, 'Supplier deleted successfully'));
});

export const getDashboardTotals = asyncHandler(async (req, res) => {
  const totals = await supplierService.getDashboardTotals();
  res.status(200).json(new ApiResponse(200, totals, 'Dashboard totals fetched successfully'));
});
