import { feedbackRepository } from './feedback.repository.js';

const buildPaginationMeta = (page, limit, totalItems) => ({
  page,
  limit,
  totalItems,
  totalPages: Math.max(1, Math.ceil(totalItems / limit)),
});

export const feedbackService = {
  async submitFeedback({ customerId, rating, category, message, pageContext, orderId }) {
    return feedbackRepository.create({ customer: customerId, rating: rating ?? null, category, message, pageContext: pageContext ?? '', orderId: orderId ?? null });
  },

  async listFeedback(query) {
    const { page, limit, ...filters } = query;
    const { items, total } = await feedbackRepository.findPaginated({ page, limit, ...filters });
    return { items, meta: buildPaginationMeta(page, limit, total) };
  },

  getSummary() {
    return feedbackRepository.getSummary();
  },
};
