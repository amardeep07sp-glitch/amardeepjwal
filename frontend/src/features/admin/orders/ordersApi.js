import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

const QUERY_KEY = 'orders';

const invalidate = (queryClient) => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });

export const useOrders = (params = {}, options = {}) =>
  useQuery({
    queryKey: [QUERY_KEY, params],
    queryFn: async () => (await api.get('/orders', { params })).data,
    placeholderData: keepPreviousData,
    ...options,
  });

export const useOrderById = (id, options = {}) =>
  useQuery({
    queryKey: [QUERY_KEY, id],
    queryFn: async () => (await api.get(`/orders/${id}`)).data,
    enabled: Boolean(id),
    ...options,
  });

export const useOrderTimeline = (id, options = {}) =>
  useQuery({
    queryKey: [QUERY_KEY, id, 'timeline'],
    queryFn: async () => (await api.get(`/orders/${id}/timeline`)).data,
    enabled: Boolean(id),
    ...options,
  });

export const useOrderActivity = (id, options = {}) =>
  useQuery({
    queryKey: [QUERY_KEY, id, 'activity'],
    queryFn: async () => (await api.get(`/orders/${id}/activity`)).data,
    enabled: Boolean(id),
    ...options,
  });

export const useDashboardTotals = (options = {}) =>
  useQuery({
    queryKey: [QUERY_KEY, 'dashboard-totals'],
    queryFn: async () => (await api.get('/orders/dashboard-totals')).data,
    ...options,
  });

export const useSalesTrend = (days = 14, options = {}) =>
  useQuery({
    queryKey: [QUERY_KEY, 'sales-trend', days],
    queryFn: async () => (await api.get('/orders/sales-trend', { params: { days } })).data,
    ...options,
  });

export const useStatusDistribution = (options = {}) =>
  useQuery({
    queryKey: [QUERY_KEY, 'status-distribution'],
    queryFn: async () => (await api.get('/orders/status-distribution')).data,
    ...options,
  });

export const usePaymentBreakdown = (options = {}) =>
  useQuery({
    queryKey: [QUERY_KEY, 'payment-breakdown'],
    queryFn: async () => (await api.get('/orders/payment-breakdown')).data,
    ...options,
  });

export const useLookupByBarcode = () =>
  useMutation({
    mutationFn: (value) => api.get(`/orders/lookup-by-barcode/${encodeURIComponent(value)}`),
  });

export const useCreateOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => api.post('/orders', payload),
    onSuccess: () => invalidate(queryClient),
  });
};

const makeAction = (path, method = 'patch') => {
  const useHook = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: ({ id, body } = {}) => api[method](`/orders/${id}${path}`, body),
      onSuccess: () => invalidate(queryClient),
    });
  };
  return useHook;
};

export const useSubmitOrder = makeAction('/submit');
export const useConfirmOrder = makeAction('/confirm');
export const useCancelOrder = makeAction('/cancel');
export const usePackOrder = makeAction('/pack');
export const useMarkReadyToShip = makeAction('/ready-to-ship');
export const useMarkDelivered = makeAction('/deliver');
export const useCompleteOrder = makeAction('/complete');
