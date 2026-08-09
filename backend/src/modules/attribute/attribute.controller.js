import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { attributeService } from './attribute.service.js';

export const listAttributes = asyncHandler(async (req, res) => {
  const { items, meta } = await attributeService.listAttributes(req.query);
  res.status(200).json(new ApiResponse(200, { items, meta }, 'Attributes fetched successfully'));
});

export const listAllAttributes = asyncHandler(async (req, res) => {
  const attributes = await attributeService.listAllActiveAttributes(req.query);
  res.status(200).json(new ApiResponse(200, attributes, 'Attributes fetched successfully'));
});

export const getAttributeById = asyncHandler(async (req, res) => {
  const attribute = await attributeService.getAttributeById(req.params.id);
  res.status(200).json(new ApiResponse(200, attribute, 'Attribute fetched successfully'));
});

export const createAttribute = asyncHandler(async (req, res) => {
  const attribute = await attributeService.createAttribute(req.body);
  res.status(201).json(new ApiResponse(201, attribute, 'Attribute created successfully'));
});

export const updateAttribute = asyncHandler(async (req, res) => {
  const attribute = await attributeService.updateAttribute(req.params.id, req.body);
  res.status(200).json(new ApiResponse(200, attribute, 'Attribute updated successfully'));
});

export const deleteAttribute = asyncHandler(async (req, res) => {
  await attributeService.deleteAttribute(req.params.id);
  res.status(200).json(new ApiResponse(200, null, 'Attribute deleted successfully'));
});
