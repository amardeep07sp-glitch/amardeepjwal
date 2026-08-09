import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export const useReceivablesOutstanding = (options = {}) =>
  useQuery({ queryKey: ['receivables', 'outstanding'], queryFn: async () => (await api.get('/receivables/outstanding')).data, ...options });

export const useReceivablesAging = (params = {}, options = {}) =>
  useQuery({ queryKey: ['receivables', 'aging', params], queryFn: async () => (await api.get('/receivables/aging', { params })).data, ...options });

export const useCustomerLedger = (customerId, options = {}) =>
  useQuery({
    queryKey: ['receivables', 'customer', customerId],
    queryFn: async () => (await api.get(`/receivables/customer/${customerId}`)).data,
    enabled: Boolean(customerId),
    ...options,
  });
