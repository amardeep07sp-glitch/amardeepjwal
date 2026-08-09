import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

const QUERY_KEY = 'supplier-payments';

const invalidate = (queryClient) => {
  queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
  queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
  queryClient.invalidateQueries({ queryKey: ['suppliers'] });
  queryClient.invalidateQueries({ queryKey: ['supplier-ledger'] });
};

export const usePaymentsForSupplier = (supplierId, options = {}) =>
  useQuery({
    queryKey: [QUERY_KEY, 'supplier', supplierId],
    queryFn: async () => (await api.get(`/supplier-payments/supplier/${supplierId}`)).data,
    enabled: Boolean(supplierId),
    ...options,
  });

export const usePaymentsForPurchaseOrder = (purchaseOrderId, options = {}) =>
  useQuery({
    queryKey: [QUERY_KEY, 'purchase-order', purchaseOrderId],
    queryFn: async () => (await api.get(`/supplier-payments/purchase-order/${purchaseOrderId}`)).data,
    enabled: Boolean(purchaseOrderId),
    ...options,
  });

export const useRecordSupplierPayment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ supplierId, ...payload }) => api.post(`/supplier-payments/supplier/${supplierId}`, payload),
    onSuccess: () => invalidate(queryClient),
  });
};

export const useRefundSupplierPayment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.patch(`/supplier-payments/${id}/refund`),
    onSuccess: () => invalidate(queryClient),
  });
};
