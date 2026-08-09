import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export const usePayablesOutstanding = (options = {}) =>
  useQuery({ queryKey: ['payables', 'outstanding'], queryFn: async () => (await api.get('/payables/outstanding')).data, ...options });

export const usePayablesAging = (params = {}, options = {}) =>
  useQuery({ queryKey: ['payables', 'aging', params], queryFn: async () => (await api.get('/payables/aging', { params })).data, ...options });

export const useSupplierLedgerReport = (supplierId, options = {}) =>
  useQuery({
    queryKey: ['payables', 'supplier', supplierId],
    queryFn: async () => (await api.get(`/payables/supplier/${supplierId}`)).data,
    enabled: Boolean(supplierId),
    ...options,
  });
