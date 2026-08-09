import { ApiError } from '../../utils/ApiError.js';
import { navbarRepository } from './navbar.repository.js';

export const navbarService = {
  listItems() {
    return navbarRepository.findAll();
  },

  createItem(data) {
    return navbarRepository.create(data);
  },

  async updateItem(id, data) {
    const item = await navbarRepository.updateById(id, data);
    if (!item) throw new ApiError(404, 'Navbar item not found');
    return item;
  },

  async deleteItem(id) {
    const item = await navbarRepository.deleteById(id);
    if (!item) throw new ApiError(404, 'Navbar item not found');
    return item;
  },
};
