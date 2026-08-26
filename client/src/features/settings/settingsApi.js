import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

// Public, unauthenticated - the storefront-safe subset only (no GSTIN/bank
// details - see settings.serializer.js#serializePublicSettings).
export const usePublicSettings = () =>
  useQuery({
    queryKey: ['storefront', 'settings'],
    queryFn: async () => (await api.get('/settings/public')).data,
    staleTime: 10 * 60 * 1000,
  });
