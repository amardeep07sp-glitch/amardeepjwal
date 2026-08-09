import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

const QUERY_KEY = 'invoices';

// Read-only - an Invoice is never created/edited by hand, it's minted once
// per order (invoice.service.js#getOrCreateInvoice) the first time anyone
// downloads it. This list is purely for finding and re-downloading one.
export const useInvoices = (params = {}, options = {}) =>
  useQuery({
    queryKey: [QUERY_KEY, params],
    queryFn: async () => (await api.get('/invoices', { params })).data,
    placeholderData: keepPreviousData,
    ...options,
  });
