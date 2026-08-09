import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { attributeGroupService } from './attributeGroup.service.js';

export const listAttributeGroups = asyncHandler(async (req, res) => {
  const { items, meta } = await attributeGroupService.listGroups(req.query);
  res.status(200).json(new ApiResponse(200, { items, meta }, 'Attribute groups fetched successfully'));
});

export const listAllAttributeGroups = asyncHandler(async (req, res) => {
  const groups = await attributeGroupService.listAllActiveGroups();
  res.status(200).json(new ApiResponse(200, groups, 'Attribute groups fetched successfully'));
});

export const getAttributeGroupById = asyncHandler(async (req, res) => {
  const group = await attributeGroupService.getGroupById(req.params.id);
  res.status(200).json(new ApiResponse(200, group, 'Attribute group fetched successfully'));
});

export const createAttributeGroup = asyncHandler(async (req, res) => {
  const group = await attributeGroupService.createGroup(req.body);
  res.status(201).json(new ApiResponse(201, group, 'Attribute group created successfully'));
});

export const updateAttributeGroup = asyncHandler(async (req, res) => {
  const group = await attributeGroupService.updateGroup(req.params.id, req.body);
  res.status(200).json(new ApiResponse(200, group, 'Attribute group updated successfully'));
});

export const deleteAttributeGroup = asyncHandler(async (req, res) => {
  await attributeGroupService.deleteGroup(req.params.id);
  res.status(200).json(new ApiResponse(200, null, 'Attribute group deleted successfully'));
});
