import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { inventoryAlertService } from './inventoryAlert.service.js';
import { serializeAlert, serializeAlertList } from './inventoryAlert.serializer.js';
import { buildPaginationMeta } from './inventory.pagination.js';

export const listAlerts = asyncHandler(async (req, res) => {
  const { page, limit, ...filters } = req.query;
  const { items, total } = await inventoryAlertService.listAlerts({ page, limit, ...filters });
  res.status(200).json(
    new ApiResponse(200, { items: serializeAlertList(items), meta: buildPaginationMeta(page, limit, total) }, 'Alerts fetched successfully')
  );
});

export const acknowledgeAlert = asyncHandler(async (req, res) => {
  const alert = await inventoryAlertService.acknowledgeAlert(req.params.id);
  res.status(200).json(new ApiResponse(200, serializeAlert(alert), 'Alert acknowledged successfully'));
});

export const resolveAlert = asyncHandler(async (req, res) => {
  const alert = await inventoryAlertService.resolveAlert(req.params.id);
  res.status(200).json(new ApiResponse(200, serializeAlert(alert), 'Alert resolved successfully'));
});
