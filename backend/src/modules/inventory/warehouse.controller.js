import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { warehouseService } from './warehouse.service.js';
import { serializeWarehouse, serializeWarehouseList } from './warehouse.serializer.js';
import { buildPaginationMeta } from './inventory.pagination.js';

export const listWarehouses = asyncHandler(async (req, res) => {
  const { page, limit, ...filters } = req.query;
  const { items, total } = await warehouseService.listWarehouses({ page, limit, ...filters });
  res.status(200).json(
    new ApiResponse(200, { items: serializeWarehouseList(items), meta: buildPaginationMeta(page, limit, total) }, 'Warehouses fetched successfully')
  );
});

export const listAllWarehouses = asyncHandler(async (req, res) => {
  const warehouses = await warehouseService.listAllWarehouses();
  res.status(200).json(new ApiResponse(200, serializeWarehouseList(warehouses), 'Warehouses fetched successfully'));
});

export const getWarehouseById = asyncHandler(async (req, res) => {
  const warehouse = await warehouseService.getWarehouseById(req.params.id);
  res.status(200).json(new ApiResponse(200, serializeWarehouse(warehouse), 'Warehouse fetched successfully'));
});

export const createWarehouse = asyncHandler(async (req, res) => {
  const warehouse = await warehouseService.createWarehouse(req.body);
  res.status(201).json(new ApiResponse(201, serializeWarehouse(warehouse), 'Warehouse created successfully'));
});

export const updateWarehouse = asyncHandler(async (req, res) => {
  const warehouse = await warehouseService.updateWarehouse(req.params.id, req.body);
  res.status(200).json(new ApiResponse(200, serializeWarehouse(warehouse), 'Warehouse updated successfully'));
});

export const setDefaultWarehouse = asyncHandler(async (req, res) => {
  const warehouse = await warehouseService.setDefault(req.params.id);
  res.status(200).json(new ApiResponse(200, serializeWarehouse(warehouse), 'Default warehouse updated successfully'));
});

export const deleteWarehouse = asyncHandler(async (req, res) => {
  await warehouseService.deleteWarehouse(req.params.id);
  res.status(200).json(new ApiResponse(200, null, 'Warehouse deleted successfully'));
});

export const bulkUpdateWarehouseStatus = asyncHandler(async (req, res) => {
  await warehouseService.bulkUpdateStatus(req.body.ids, req.body.status);
  res.status(200).json(new ApiResponse(200, null, 'Warehouses updated successfully'));
});
