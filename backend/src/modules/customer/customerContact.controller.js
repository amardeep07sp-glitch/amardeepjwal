import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { customerContactService } from './customerContact.service.js';
import { serializeContact, serializeContactList } from './customerContact.serializer.js';

export const listContacts = asyncHandler(async (req, res) => {
  const contacts = await customerContactService.listForCustomer(req.params.customerId);
  res.status(200).json(new ApiResponse(200, serializeContactList(contacts), 'Contacts fetched successfully'));
});

export const createContact = asyncHandler(async (req, res) => {
  const contact = await customerContactService.createContact(req.params.customerId, req.body);
  res.status(201).json(new ApiResponse(201, serializeContact(contact), 'Contact created successfully'));
});

export const updateContact = asyncHandler(async (req, res) => {
  const contact = await customerContactService.updateContact(req.params.id, req.body);
  res.status(200).json(new ApiResponse(200, serializeContact(contact), 'Contact updated successfully'));
});

export const deleteContact = asyncHandler(async (req, res) => {
  await customerContactService.deleteContact(req.params.id);
  res.status(200).json(new ApiResponse(200, null, 'Contact deleted successfully'));
});
