import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

const QUERY_KEY = 'order-returns';

const invalidate = (queryClient) => {
  queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
  queryClient.invalidateQueries({ queryKey: ['orders'] });
  queryClient.invalidateQueries({ queryKey: ['inventory'] });
};

export const useReturns = (params = {}, options = {}) =>
  useQuery({
    queryKey: [QUERY_KEY, params],
    queryFn: async () => (await api.get('/order-returns', { params })).data,
    placeholderData: keepPreviousData,
    ...options,
  });

export const useReturnsForOrder = (orderId, options = {}) =>
  useQuery({
    queryKey: [QUERY_KEY, 'order', orderId],
    queryFn: async () => (await api.get(`/order-returns/order/${orderId}`)).data,
    enabled: Boolean(orderId),
    ...options,
  });

export const useRequestReturn = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, ...payload }) => api.post(`/order-returns/order/${orderId}`, payload),
    onSuccess: () => invalidate(queryClient),
  });
};

const makeTransition = (path) => () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.patch(`/order-returns/${id}${path}`),
    onSuccess: () => invalidate(queryClient),
  });
};

export const useApproveReturn = makeTransition('/approve');
export const useRejectReturn = makeTransition('/reject');
export const useSchedulePickup = makeTransition('/schedule-pickup');
export const useMarkReturnReceived = makeTransition('/receive');
export const useMarkReturnInspected = makeTransition('/inspect');
export const useAcceptReturn = makeTransition('/accept');
export const useRestockReturn = makeTransition('/restock');
