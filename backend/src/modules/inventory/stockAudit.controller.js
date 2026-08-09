import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { stockAuditService } from './stockAudit.service.js';
import { serializeStockAudit, serializeStockAuditList } from './stockAudit.serializer.js';
import { buildPaginationMeta } from './inventory.pagination.js';

export const listAudits = asyncHandler(async (req, res) => {
  const { page, limit, ...filters } = req.query;
  const { items, total } = await stockAuditService.listAudits({ page, limit, ...filters });
  res.status(200).json(
    new ApiResponse(200, { items: serializeStockAuditList(items), meta: buildPaginationMeta(page, limit, total) }, 'Stock audits fetched successfully')
  );
});

export const getAuditById = asyncHandler(async (req, res) => {
  const audit = await stockAuditService.getAuditById(req.params.id);
  res.status(200).json(new ApiResponse(200, serializeStockAudit(audit), 'Stock audit fetched successfully'));
});

export const createAudit = asyncHandler(async (req, res) => {
  const audit = await stockAuditService.createAudit(req.body, req.user._id);
  res.status(201).json(new ApiResponse(201, serializeStockAudit(audit), 'Stock audit created successfully'));
});

export const completeAudit = asyncHandler(async (req, res) => {
  const audit = await stockAuditService.completeAudit(req.params.id, req.user._id);
  res.status(200).json(new ApiResponse(200, serializeStockAudit(audit), 'Stock audit completed successfully'));
});
