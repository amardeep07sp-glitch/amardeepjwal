import { ApiError } from '../../utils/ApiError.js';
import { addressRepository } from './address.repository.js';

export const addressService = {
  listForCustomer(customerId) {
    return addressRepository.findByCustomer(customerId);
  },

  async getById(id) {
    const address = await addressRepository.findById(id);
    if (!address) throw new ApiError(404, 'Address not found');
    return address;
  },

  async createAddress(data) {
    const address = await addressRepository.create(data);
    if (data.isDefaultBilling) await addressRepository.unsetDefaultExcept(address.customer, 'isDefaultBilling', address._id);
    if (data.isDefaultShipping) await addressRepository.unsetDefaultExcept(address.customer, 'isDefaultShipping', address._id);
    return address;
  },

  async updateAddress(id, data) {
    const address = await addressRepository.updateById(id, data);
    if (!address) throw new ApiError(404, 'Address not found');
    if (data.isDefaultBilling) await addressRepository.unsetDefaultExcept(address.customer, 'isDefaultBilling', address._id);
    if (data.isDefaultShipping) await addressRepository.unsetDefaultExcept(address.customer, 'isDefaultShipping', address._id);
    return address;
  },

  // No delete-protection rule here (unlike Warehouse/Barcode) - an Order
  // never reads an Address live, it snapshots one immutably at confirm-time
  // (see order.service.js#confirmOrder), so a stale ref after this address
  // is deleted can never corrupt a placed order.
  async deleteAddress(id) {
    const deleted = await addressRepository.deleteById(id);
    if (!deleted) throw new ApiError(404, 'Address not found');
  },
};
