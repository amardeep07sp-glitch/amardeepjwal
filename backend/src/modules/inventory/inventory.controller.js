import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { inventoryService } from './inventory.service.js';
import { serializeInventory, serializeInventoryList, serializeMovementList } from './inventory.serializer.js';

export const listInventory = asyncHandler(async (req, res) => {
  const result = await inventoryService.listInventory(req.query);
  res.status(200).json(
    new ApiResponse(200, { items: serializeInventoryList(result.items), meta: result.meta }, 'Inventory fetched successfully')
  );
});

export const getInventoryById = asyncHandler(async (req, res) => {
  const inventory = await inventoryService.getInventoryById(req.params.id);
  res.status(200).json(new ApiResponse(200, serializeInventory(inventory), 'Inventory fetched successfully'));
});

export const getInventoryForProduct = asyncHandler(async (req, res) => {
  const items = await inventoryService.getInventoryForProduct(req.params.productId);
  res.status(200).json(new ApiResponse(200, serializeInventoryList(items), 'Inventory fetched successfully'));
});

export const getLedger = asyncHandler(async (req, res) => {
  const result = await inventoryService.getLedger(req.params.id, req.query);
  res.status(200).json(
    new ApiResponse(200, { items: serializeMovementList(result.items), meta: result.meta }, 'Ledger fetched successfully')
  );
});

export const getRecentMovements = asyncHandler(async (req, res) => {
  const movements = await inventoryService.getRecentMovements(Number(req.query.limit) || 10);
  res.status(200).json(new ApiResponse(200, serializeMovementList(movements), 'Recent movements fetched successfully'));
});

export const getDashboardTotals = asyncHandler(async (req, res) => {
  const totals = await inventoryService.getDashboardTotals();
  res.status(200).json(new ApiResponse(200, totals, 'Dashboard totals fetched successfully'));
});

export const exportInventory = asyncHandler(async (req, res) => {
  const csv = await inventoryService.exportInventoryCsv();
  res.status(200);
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="inventory-export-${Date.now()}.csv"`);
  res.send(csv);
});

export const importInventorySettings = asyncHandler(async (req, res) => {
  const result = await inventoryService.importInventorySettingsCsv(req.file.buffer, req.user._id);
  res.status(200).json(new ApiResponse(200, result, 'Inventory settings import processed'));
});

export const updateInventorySettings = asyncHandler(async (req, res) => {
  const inventory = await inventoryService.updateInventorySettings(req.params.id, req.body, req.user._id);
  res.status(200).json(new ApiResponse(200, serializeInventory(inventory), 'Inventory settings updated successfully'));
});

export const reserveStock = asyncHandler(async (req, res) => {
  const movement = await inventoryService.reserveStock(req.params.id, req.body.quantity, {
    referenceType: req.body.referenceType,
    referenceId: req.body.referenceId,
    performedBy: req.user._id,
  });
  res.status(200).json(new ApiResponse(200, movement, 'Stock reserved successfully'));
});

export const releaseReservation = asyncHandler(async (req, res) => {
  const movement = await inventoryService.releaseReservation(req.params.id, req.body.quantity, {
    referenceType: req.body.referenceType,
    referenceId: req.body.referenceId,
    performedBy: req.user._id,
  });
  res.status(200).json(new ApiResponse(200, movement, 'Reservation released successfully'));
});

export const convertReservationToSale = asyncHandler(async (req, res) => {
  const movement = await inventoryService.convertReservationToSale(req.params.id, req.body.quantity, {
    referenceType: req.body.referenceType,
    referenceId: req.body.referenceId,
    performedBy: req.user._id,
  });
  res.status(200).json(new ApiResponse(200, movement, 'Reservation converted to sale successfully'));
});
