import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { navbarService } from './navbar.service.js';

export const listNavbarItems = asyncHandler(async (req, res) => {
  const items = await navbarService.listItems();
  res.status(200).json(new ApiResponse(200, items, 'Navbar items fetched successfully'));
});

export const listPublicNavbarItems = asyncHandler(async (req, res) => {
  const items = await navbarService.listPublicItems();
  res.status(200).json(new ApiResponse(200, items, 'Navbar items fetched successfully'));
});

export const createNavbarItem = asyncHandler(async (req, res) => {
  const item = await navbarService.createItem(req.body);
  res.status(201).json(new ApiResponse(201, item, 'Navbar item created successfully'));
});

export const updateNavbarItem = asyncHandler(async (req, res) => {
  const item = await navbarService.updateItem(req.params.id, req.body);
  res.status(200).json(new ApiResponse(200, item, 'Navbar item updated successfully'));
});

export const deleteNavbarItem = asyncHandler(async (req, res) => {
  await navbarService.deleteItem(req.params.id);
  res.status(200).json(new ApiResponse(200, null, 'Navbar item deleted successfully'));
});
