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

// The homepage "Loved by Our Customers" section's real data source - the
// highest-rated, actually-written approved reviews across every product
// (review.repository.js#findFeatured), not invented quotes. Empty on a
// fresh store with no reviews yet - Testimonials.jsx hides the whole
// section in that case rather than backfilling with placeholder copy.
export const useFeaturedReviews = (limit = 6) =>
  useQuery({
    queryKey: ['storefront', 'reviews', 'featured', limit],
    queryFn: async () => (await api.get('/reviews/featured', { params: { limit } })).data,
    staleTime: 10 * 60 * 1000,
  });
