import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

const QUERY_KEY = 'order-refunds';

const invalidate = (queryClient) => {
  queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
  queryClient.invalidateQueries({ queryKey: ['orders'] });
};

export const useRefunds = (params = {}, options = {}) =>
  useQuery({
    queryKey: [QUERY_KEY, params],
    queryFn: async () => (await api.get('/order-refunds', { params })).data,
    placeholderData: keepPreviousData,
    ...options,
  });

export const useRefundsForOrder = (orderId, options = {}) =>
  useQuery({
    queryKey: [QUERY_KEY, 'order', orderId],
    queryFn: async () => (await api.get(`/order-refunds/order/${orderId}`)).data,
    enabled: Boolean(orderId),
    ...options,
  });

export const useCreateRefund = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, ...payload }) => api.post(`/order-refunds/order/${orderId}`, payload),
    onSuccess: () => invalidate(queryClient),
  });
};

export const useProcessRefund = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }) => api.patch(`/order-refunds/${id}/process`, payload),
    onSuccess: () => invalidate(queryClient),
  });
};

export const useFailRefund = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }) => api.patch(`/order-refunds/${id}/fail`, { reason }),
    onSuccess: () => invalidate(queryClient),
  });
};
