import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

const QUERY_KEY = 'purchase-orders';

const invalidate = (queryClient) => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });

export const usePurchaseOrders = (params = {}, options = {}) =>
  useQuery({
    queryKey: [QUERY_KEY, params],
    queryFn: async () => (await api.get('/purchase-orders', { params })).data,
    placeholderData: keepPreviousData,
    ...options,
  });

export const usePurchaseOrderById = (id, options = {}) =>
  useQuery({
    queryKey: [QUERY_KEY, id],
    queryFn: async () => (await api.get(`/purchase-orders/${id}`)).data,
    enabled: Boolean(id),
    ...options,
  });

export const usePurchaseDashboardTotals = (options = {}) =>
  useQuery({
    queryKey: [QUERY_KEY, 'dashboard-totals'],
    queryFn: async () => (await api.get('/purchase-orders/dashboard-totals')).data,
    ...options,
  });

export const usePurchaseTrend = (days = 14, options = {}) =>
  useQuery({
    queryKey: [QUERY_KEY, 'purchase-trend', days],
    queryFn: async () => (await api.get('/purchase-orders/purchase-trend', { params: { days } })).data,
    ...options,
  });

export const useSupplierPerformance = (options = {}) =>
  useQuery({
    queryKey: [QUERY_KEY, 'supplier-performance'],
    queryFn: async () => (await api.get('/purchase-orders/supplier-performance')).data,
    ...options,
  });

export const useCreatePurchaseOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => api.post('/purchase-orders', payload),
    onSuccess: () => invalidate(queryClient),
  });
};

const makeAction = (path) => {
  const useHook = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: ({ id, body } = {}) => api.patch(`/purchase-orders/${id}${path}`, body),
      onSuccess: () => invalidate(queryClient),
    });
  };
  return useHook;
};

export const useSubmitForApproval = makeAction('/submit');
export const useApprovePurchaseOrder = makeAction('/approve');
export const useMarkOrdered = makeAction('/mark-ordered');
export const useCancelPurchaseOrder = makeAction('/cancel');
