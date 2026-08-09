import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { attributeValueService } from './attributeValue.service.js';

export const listAttributeValues = asyncHandler(async (req, res) => {
  const { items, meta } = await attributeValueService.listValues(req.query);
  res.status(200).json(new ApiResponse(200, { items, meta }, 'Attribute values fetched successfully'));
});

export const listAttributeValuesByAttribute = asyncHandler(async (req, res) => {
  const values = await attributeValueService.listValuesByAttribute(req.params.attributeId);
  res.status(200).json(new ApiResponse(200, values, 'Attribute values fetched successfully'));
});

export const getAttributeValueById = asyncHandler(async (req, res) => {
  const value = await attributeValueService.getValueById(req.params.id);
  res.status(200).json(new ApiResponse(200, value, 'Attribute value fetched successfully'));
});

export const createAttributeValue = asyncHandler(async (req, res) => {
  const value = await attributeValueService.createValue(req.body);
  res.status(201).json(new ApiResponse(201, value, 'Attribute value created successfully'));
});

export const updateAttributeValue = asyncHandler(async (req, res) => {
  const value = await attributeValueService.updateValue(req.params.id, req.body);
  res.status(200).json(new ApiResponse(200, value, 'Attribute value updated successfully'));
});

export const deleteAttributeValue = asyncHandler(async (req, res) => {
  await attributeValueService.deleteValue(req.params.id);
  res.status(200).json(new ApiResponse(200, null, 'Attribute value deleted successfully'));
});
