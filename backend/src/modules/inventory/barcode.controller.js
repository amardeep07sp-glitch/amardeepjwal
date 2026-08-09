import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { barcodeService } from './barcode.service.js';
import { serializeBarcode, serializeBarcodeList } from './barcode.serializer.js';
import { buildPaginationMeta } from './inventory.pagination.js';

export const listBarcodes = asyncHandler(async (req, res) => {
  const { page, limit, ...filters } = req.query;
  const { items, total } = await barcodeService.listBarcodes({ page, limit, ...filters });
  res.status(200).json(
    new ApiResponse(200, { items: serializeBarcodeList(items), meta: buildPaginationMeta(page, limit, total) }, 'Barcodes fetched successfully')
  );
});

export const getBarcodeById = asyncHandler(async (req, res) => {
  const barcode = await barcodeService.getBarcodeById(req.params.id);
  res.status(200).json(new ApiResponse(200, serializeBarcode(barcode), 'Barcode fetched successfully'));
});

export const generateBarcode = asyncHandler(async (req, res) => {
  const barcode = await barcodeService.generateBarcode(req.body);
  res.status(201).json(new ApiResponse(201, serializeBarcode(barcode), 'Barcode generated successfully'));
});

export const regenerateBarcode = asyncHandler(async (req, res) => {
  const barcode = await barcodeService.regenerateBarcode(req.body);
  res.status(201).json(new ApiResponse(201, serializeBarcode(barcode), 'Barcode regenerated successfully'));
});

export const deleteBarcode = asyncHandler(async (req, res) => {
  await barcodeService.deleteBarcode(req.params.id);
  res.status(200).json(new ApiResponse(200, null, 'Barcode deleted successfully'));
});
