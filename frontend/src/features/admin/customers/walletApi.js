import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

const QUERY_KEY = 'customer-wallet';

export const useWallet = (customerId, options = {}) =>
  useQuery({
    queryKey: [QUERY_KEY, customerId],
    queryFn: async () => (await api.get(`/customer-wallet/${customerId}`)).data,
    enabled: Boolean(customerId),
    ...options,
  });

export const useWalletLedger = (customerId, params = {}, options = {}) =>
  useQuery({
    queryKey: [QUERY_KEY, customerId, 'ledger', params],
    queryFn: async () => (await api.get(`/customer-wallet/${customerId}/ledger`, { params })).data,
    enabled: Boolean(customerId),
    ...options,
  });

export const useRecordWalletTransaction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ customerId, ...payload }) => api.post(`/customer-wallet/${customerId}/transactions`, payload),
    onSuccess: (_, variables) => queryClient.invalidateQueries({ queryKey: [QUERY_KEY, variables.customerId] }),
  });
};
