import { ApiError } from '../../utils/ApiError.js';
import { homepageSectionRepository } from './homepageSection.repository.js';

export const homepageSectionService = {
  listSections() {
    return homepageSectionRepository.findAll();
  },

  createSection(data) {
    return homepageSectionRepository.create(data);
  },

  async updateSection(id, data) {
    const section = await homepageSectionRepository.updateById(id, data);
    if (!section) throw new ApiError(404, 'Homepage section not found');
    return section;
  },

  async deleteSection(id) {
    const section = await homepageSectionRepository.deleteById(id);
    if (!section) throw new ApiError(404, 'Homepage section not found');
    return section;
  },
};
