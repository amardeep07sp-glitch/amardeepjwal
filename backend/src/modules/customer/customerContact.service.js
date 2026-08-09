import { ApiError } from '../../utils/ApiError.js';
import { customerContactRepository } from './customerContact.repository.js';

export const customerContactService = {
  listForCustomer(customerId) {
    return customerContactRepository.findByCustomer(customerId);
  },

  createContact(customerId, data) {
    return customerContactRepository.create({ ...data, customer: customerId });
  },

  async updateContact(id, data) {
    const contact = await customerContactRepository.updateById(id, data);
    if (!contact) throw new ApiError(404, 'Contact not found');
    return contact;
  },

  async deleteContact(id) {
    const deleted = await customerContactRepository.deleteById(id);
    if (!deleted) throw new ApiError(404, 'Contact not found');
  },
};
