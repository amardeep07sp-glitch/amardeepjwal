import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

// Public, unauthenticated - every visitor (logged in or not) should see
// active site-wide announcements admin has broadcast, same as banners/navbar.
export const useActiveBroadcasts = () =>
  useQuery({
    queryKey: ['storefront', 'broadcasts', 'active'],
    queryFn: async () => (await api.get('/broadcasts/active')).data,
    staleTime: 2 * 60 * 1000,
  });
