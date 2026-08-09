import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

// Public, unauthenticated /banners/public route (backend/src/modules/banner)
// - active, imaged, currently-in-schedule banners for a position. Used by
// HeroBanner (homepage_hero) and PromoBanners (homepage_secondary).
export const useBanners = (position) =>
  useQuery({
    queryKey: ['storefront', 'banners', position],
    queryFn: async () => (await api.get('/banners/public', { params: { position } })).data,
    staleTime: 5 * 60 * 1000,
  });
