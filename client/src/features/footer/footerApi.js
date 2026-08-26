import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

// Public, unauthenticated - active footer columns/links an admin has set up
// (Admin -> CMS -> Footer). Additive to Footer.jsx's own built-in Shop/
// Collections/Customer Service columns, never a replacement for them.
export const usePublicFooterColumns = () =>
  useQuery({
    queryKey: ['storefront', 'footer-columns'],
    queryFn: async () => (await api.get('/footer-columns/public')).data,
    staleTime: 5 * 60 * 1000,
  });
