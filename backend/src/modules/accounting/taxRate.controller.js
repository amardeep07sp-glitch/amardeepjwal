import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { taxService } from './tax.service.js';
import { serializeTaxRate, serializeTaxRateList } from './taxRate.serializer.js';

export const listTaxRates = asyncHandler(async (req, res) => {
  const rates = await taxService.listRates();
  res.status(200).json(new ApiResponse(200, serializeTaxRateList(rates), 'Tax rates fetched successfully'));
});

export const createTaxRate = asyncHandler(async (req, res) => {
  const rate = await taxService.createRate(req.body);
  res.status(201).json(new ApiResponse(201, serializeTaxRate(rate), 'Tax rate created successfully'));
});

export const updateTaxRate = asyncHandler(async (req, res) => {
  const rate = await taxService.updateRate(req.params.id, req.body);
  res.status(200).json(new ApiResponse(200, serializeTaxRate(rate), 'Tax rate updated successfully'));
});

export const deleteTaxRate = asyncHandler(async (req, res) => {
  await taxService.deleteRate(req.params.id);
  res.status(200).json(new ApiResponse(200, null, 'Tax rate deleted successfully'));
});

export const getTaxSummary = asyncHandler(async (req, res) => {
  const summary = await taxService.getTaxSummary(req.query);
  res.status(200).json(new ApiResponse(200, summary, 'Tax summary fetched successfully'));
});
