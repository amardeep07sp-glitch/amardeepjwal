import { ApiError } from '../../utils/ApiError.js';
import { supplierContactRepository } from './supplierContact.repository.js';

export const supplierContactService = {
  listForSupplier(supplierId) {
    return supplierContactRepository.findBySupplier(supplierId);
  },

  createContact(supplierId, data) {
    return supplierContactRepository.create({ ...data, supplier: supplierId });
  },

  async updateContact(id, data) {
    const contact = await supplierContactRepository.updateById(id, data);
    if (!contact) throw new ApiError(404, 'Contact not found');
    return contact;
  },

  async deleteContact(id) {
    const deleted = await supplierContactRepository.deleteById(id);
    if (!deleted) throw new ApiError(404, 'Contact not found');
  },
};
