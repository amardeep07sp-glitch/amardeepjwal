import { ApiError } from '../../utils/ApiError.js';
import { customerTagRepository } from './customerTag.repository.js';

export const customerTagService = {
  listTags() {
    return customerTagRepository.findAll();
  },

  createTag(data) {
    return customerTagRepository.create(data);
  },

  async updateTag(id, data) {
    const tag = await customerTagRepository.updateById(id, data);
    if (!tag) throw new ApiError(404, 'Tag not found');
    return tag;
  },

  async deleteTag(id) {
    const deleted = await customerTagRepository.deleteById(id);
    if (!deleted) throw new ApiError(404, 'Tag not found');
  },
};
