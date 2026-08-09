import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { addressService } from './address.service.js';
import { serializeAddress, serializeAddressList } from './address.serializer.js';

export const listAddressesForCustomer = asyncHandler(async (req, res) => {
  const addresses = await addressService.listForCustomer(req.params.customerId);
  res.status(200).json(new ApiResponse(200, serializeAddressList(addresses), 'Addresses fetched successfully'));
});

export const getAddressById = asyncHandler(async (req, res) => {
  const address = await addressService.getById(req.params.id);
  res.status(200).json(new ApiResponse(200, serializeAddress(address), 'Address fetched successfully'));
});

export const createAddress = asyncHandler(async (req, res) => {
  const address = await addressService.createAddress(req.body);
  res.status(201).json(new ApiResponse(201, serializeAddress(address), 'Address created successfully'));
});

export const updateAddress = asyncHandler(async (req, res) => {
  const address = await addressService.updateAddress(req.params.id, req.body);
  res.status(200).json(new ApiResponse(200, serializeAddress(address), 'Address updated successfully'));
});

export const deleteAddress = asyncHandler(async (req, res) => {
  await addressService.deleteAddress(req.params.id);
  res.status(200).json(new ApiResponse(200, null, 'Address deleted successfully'));
});
