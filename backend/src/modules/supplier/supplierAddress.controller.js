import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { supplierAddressService } from './supplierAddress.service.js';
import { serializeSupplierAddress, serializeSupplierAddressList } from './supplierAddress.serializer.js';

export const listAddresses = asyncHandler(async (req, res) => {
  const addresses = await supplierAddressService.listForSupplier(req.params.supplierId);
  res.status(200).json(new ApiResponse(200, serializeSupplierAddressList(addresses), 'Addresses fetched successfully'));
});

export const createAddress = asyncHandler(async (req, res) => {
  const address = await supplierAddressService.createAddress(req.params.supplierId, req.body);
  res.status(201).json(new ApiResponse(201, serializeSupplierAddress(address), 'Address created successfully'));
});

export const updateAddress = asyncHandler(async (req, res) => {
  const address = await supplierAddressService.updateAddress(req.params.id, req.body);
  res.status(200).json(new ApiResponse(200, serializeSupplierAddress(address), 'Address updated successfully'));
});

export const deleteAddress = asyncHandler(async (req, res) => {
  await supplierAddressService.deleteAddress(req.params.id);
  res.status(200).json(new ApiResponse(200, null, 'Address deleted successfully'));
});
