import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

// Public, unauthenticated - approved reviews only (review.service.js's
// moderation gate), plus the real rating summary/breakdown for the same
// product. `slug`-keyed so it shares nothing with the customer's own
// "my review" queries in storefrontApi.js (different resource entirely).
export const useProductReviews = (slug, { page = 1, limit = 10 } = {}) =>
  useQuery({
    queryKey: ['storefront', 'products', 'reviews', slug, { page, limit }],
    queryFn: async () => (await api.get(`/products/public/${slug}/reviews`, { params: { page, limit } })).data,
    enabled: Boolean(slug),
    placeholderData: keepPreviousData,
  });
