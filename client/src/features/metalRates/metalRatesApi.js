import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

// Public, unauthenticated - real staff-entered rates (metalRate.model.js),
// never a live/scraped feed - see MetalRatesPage.jsx's admin-side note.
export const usePublicMetalRates = () =>
  useQuery({
    queryKey: ['storefront', 'metal-rates'],
    queryFn: async () => (await api.get('/metal-rates/public')).data,
    staleTime: 5 * 60 * 1000,
  });
