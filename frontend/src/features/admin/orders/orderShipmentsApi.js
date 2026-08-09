import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

const QUERY_KEY = 'order-shipments';

const invalidate = (queryClient) => {
  queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
  queryClient.invalidateQueries({ queryKey: ['orders'] });
};

export const useShipments = (params = {}, options = {}) =>
  useQuery({
    queryKey: [QUERY_KEY, params],
    queryFn: async () => (await api.get('/order-shipments', { params })).data,
    placeholderData: keepPreviousData,
    ...options,
  });

export const useShipmentsForOrder = (orderId, options = {}) =>
  useQuery({
    queryKey: [QUERY_KEY, 'order', orderId],
    queryFn: async () => (await api.get(`/order-shipments/order/${orderId}`)).data,
    enabled: Boolean(orderId),
    ...options,
  });

export const useCreateShipment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, ...payload }) => api.post(`/order-shipments/order/${orderId}`, payload),
    onSuccess: () => invalidate(queryClient),
  });
};

export const useUpdateShipmentTracking = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }) => api.put(`/order-shipments/${id}`, payload),
    onSuccess: () => invalidate(queryClient),
  });
};

export const useMarkShipmentDelivered = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.patch(`/order-shipments/${id}/deliver`),
    onSuccess: () => invalidate(queryClient),
  });
};
