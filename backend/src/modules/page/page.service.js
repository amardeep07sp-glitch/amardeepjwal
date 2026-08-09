import { ApiError } from '../../utils/ApiError.js';
import { pageRepository } from './page.repository.js';

export const pageService = {
  listPages() {
    return pageRepository.findAll();
  },

  createPage(data) {
    return pageRepository.create(data);
  },

  async updatePage(id, data) {
    const page = await pageRepository.updateById(id, data);
    if (!page) throw new ApiError(404, 'Page not found');
    return page;
  },

  async deletePage(id) {
    const page = await pageRepository.deleteById(id);
    if (!page) throw new ApiError(404, 'Page not found');
    return page;
  },
};
