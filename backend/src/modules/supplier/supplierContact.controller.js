import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { supplierContactService } from './supplierContact.service.js';
import { serializeSupplierContact, serializeSupplierContactList } from './supplierContact.serializer.js';

export const listContacts = asyncHandler(async (req, res) => {
  const contacts = await supplierContactService.listForSupplier(req.params.supplierId);
  res.status(200).json(new ApiResponse(200, serializeSupplierContactList(contacts), 'Contacts fetched successfully'));
});

export const createContact = asyncHandler(async (req, res) => {
  const contact = await supplierContactService.createContact(req.params.supplierId, req.body);
  res.status(201).json(new ApiResponse(201, serializeSupplierContact(contact), 'Contact created successfully'));
});

export const updateContact = asyncHandler(async (req, res) => {
  const contact = await supplierContactService.updateContact(req.params.id, req.body);
  res.status(200).json(new ApiResponse(200, serializeSupplierContact(contact), 'Contact updated successfully'));
});

export const deleteContact = asyncHandler(async (req, res) => {
  await supplierContactService.deleteContact(req.params.id);
  res.status(200).json(new ApiResponse(200, null, 'Contact deleted successfully'));
});
