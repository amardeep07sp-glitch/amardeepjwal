import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

const QUERY_KEY = 'goods-receipt-notes';

export const useGrnsForPurchaseOrder = (purchaseOrderId, options = {}) =>
  useQuery({
    queryKey: [QUERY_KEY, purchaseOrderId],
    queryFn: async () => (await api.get(`/goods-receipt-notes/purchase-order/${purchaseOrderId}`)).data,
    enabled: Boolean(purchaseOrderId),
    ...options,
  });

export const useReceiveGoods = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ purchaseOrderId, ...payload }) => api.post(`/goods-receipt-notes/purchase-order/${purchaseOrderId}`, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, variables.purchaseOrderId] });
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
    },
  });
};
