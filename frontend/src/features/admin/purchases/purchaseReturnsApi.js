import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

const QUERY_KEY = 'purchase-returns';

const invalidate = (queryClient) => {
  queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
  queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
  queryClient.invalidateQueries({ queryKey: ['suppliers'] });
  queryClient.invalidateQueries({ queryKey: ['supplier-ledger'] });
};

export const usePurchaseReturns = (params = {}, options = {}) =>
  useQuery({
    queryKey: [QUERY_KEY, params],
    queryFn: async () => (await api.get('/purchase-returns', { params })).data,
    placeholderData: keepPreviousData,
    ...options,
  });

export const useReturnsForPurchaseOrder = (purchaseOrderId, options = {}) =>
  useQuery({
    queryKey: [QUERY_KEY, 'purchase-order', purchaseOrderId],
    queryFn: async () => (await api.get(`/purchase-returns/purchase-order/${purchaseOrderId}`)).data,
    enabled: Boolean(purchaseOrderId),
    ...options,
  });

export const useRequestPurchaseReturn = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ purchaseOrderId, ...payload }) => api.post(`/purchase-returns/purchase-order/${purchaseOrderId}`, payload),
    onSuccess: () => invalidate(queryClient),
  });
};

const makeAction = (path) => {
  const useHook = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (id) => api.patch(`/purchase-returns/${id}${path}`),
      onSuccess: () => invalidate(queryClient),
    });
  };
  return useHook;
};

export const useApprovePurchaseReturn = makeAction('/approve');
export const useRejectPurchaseReturn = makeAction('/reject');
export const useCompletePurchaseReturn = makeAction('/complete');
