import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

// All three hit public, unauthenticated /brands/public/* routes
// (backend/src/modules/brand) - published + visible brands only, each with
// a real productCount joined from live published products (never a
// fabricated number - see brand.service.js#listPublicBrands).

export const useBrandList = ({ page = 1, limit = 20 } = {}) =>
  useQuery({
    queryKey: ['storefront', 'brands', 'list', { page, limit }],
    queryFn: async () => (await api.get('/brands/public', { params: { page, limit } })).data,
    placeholderData: keepPreviousData,
  });

export const useFeaturedBrands = (limit = 8) =>
  useQuery({
    queryKey: ['storefront', 'brands', 'featured', limit],
    queryFn: async () => (await api.get('/brands/public/featured', { params: { limit } })).data,
    staleTime: 10 * 60 * 1000,
  });

// A single brand by slug - used for the Brand detail page's banner/logo
// header (its products are fetched separately via useProductList, filtered
// by the same slug).
export const useBrandBySlug = (slug) =>
  useQuery({
    queryKey: ['storefront', 'brands', slug],
    queryFn: async () => (await api.get(`/brands/public/${slug}`)).data,
    enabled: Boolean(slug),
    staleTime: 10 * 60 * 1000,
  });
