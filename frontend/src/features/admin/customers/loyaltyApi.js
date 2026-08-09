import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

const QUERY_KEY = 'customer-loyalty';

export const useLoyalty = (customerId, options = {}) =>
  useQuery({
    queryKey: [QUERY_KEY, customerId],
    queryFn: async () => (await api.get(`/customer-loyalty/${customerId}`)).data,
    enabled: Boolean(customerId),
    ...options,
  });

export const useLoyaltyLedger = (customerId, params = {}, options = {}) =>
  useQuery({
    queryKey: [QUERY_KEY, customerId, 'ledger', params],
    queryFn: async () => (await api.get(`/customer-loyalty/${customerId}/ledger`, { params })).data,
    enabled: Boolean(customerId),
    ...options,
  });

export const useRecordLoyaltyTransaction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ customerId, ...payload }) => api.post(`/customer-loyalty/${customerId}/transactions`, payload),
    onSuccess: (_, variables) => queryClient.invalidateQueries({ queryKey: [QUERY_KEY, variables.customerId] }),
  });
};
