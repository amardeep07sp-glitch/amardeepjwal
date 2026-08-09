import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

const QUERY_KEY = 'order-payments';

const invalidate = (queryClient, orderId) => {
  queryClient.invalidateQueries({ queryKey: [QUERY_KEY, orderId] });
  queryClient.invalidateQueries({ queryKey: ['orders', orderId] });
};

export const useOrderPayments = (orderId, options = {}) =>
  useQuery({
    queryKey: [QUERY_KEY, orderId],
    queryFn: async () => (await api.get(`/order-payments/order/${orderId}`)).data,
    enabled: Boolean(orderId),
    ...options,
  });

export const useRecordManualPayment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, ...payload }) => api.post(`/order-payments/order/${orderId}/manual`, payload),
    onSuccess: (_, variables) => invalidate(queryClient, variables.orderId),
  });
};

export const useInitiateRazorpayPayment = () =>
  useMutation({
    mutationFn: (orderId) => api.post(`/order-payments/order/${orderId}/razorpay/initiate`),
  });

export const useVerifyRazorpayPayment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => api.post('/order-payments/razorpay/verify', payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
};
