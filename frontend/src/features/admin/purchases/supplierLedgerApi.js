import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

const QUERY_KEY = 'supplier-ledger';

export const useSupplierLedger = (supplierId, params = {}, options = {}) =>
  useQuery({
    queryKey: [QUERY_KEY, supplierId, params],
    queryFn: async () => (await api.get(`/supplier-ledger/${supplierId}`, { params })).data,
    enabled: Boolean(supplierId),
    placeholderData: keepPreviousData,
    ...options,
  });
