import { ApiError } from '../../utils/ApiError.js';
import { supplierAddressRepository } from './supplierAddress.repository.js';

export const supplierAddressService = {
  listForSupplier(supplierId) {
    return supplierAddressRepository.findBySupplier(supplierId);
  },

  createAddress(supplierId, data) {
    return supplierAddressRepository.create({ ...data, supplier: supplierId });
  },

  async updateAddress(id, data) {
    const address = await supplierAddressRepository.updateById(id, data);
    if (!address) throw new ApiError(404, 'Address not found');
    return address;
  },

  async deleteAddress(id) {
    const deleted = await supplierAddressRepository.deleteById(id);
    if (!deleted) throw new ApiError(404, 'Address not found');
  },
};
