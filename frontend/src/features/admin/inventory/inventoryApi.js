import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

const QUERY_KEY = 'inventory';

const invalidate = (queryClient) => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });

export const useInventoryList = (params = {}, options = {}) =>
  useQuery({
    queryKey: [QUERY_KEY, params],
    queryFn: async () => (await api.get('/inventory', { params })).data,
    placeholderData: keepPreviousData,
    ...options,
  });

export const useInventoryById = (id, options = {}) =>
  useQuery({
    queryKey: [QUERY_KEY, id],
    queryFn: async () => (await api.get(`/inventory/${id}`)).data,
    enabled: Boolean(id),
    ...options,
  });

export const useInventoryForProduct = (productId, options = {}) =>
  useQuery({
    queryKey: [QUERY_KEY, 'product', productId],
    queryFn: async () => (await api.get(`/inventory/product/${productId}`)).data,
    enabled: Boolean(productId),
    ...options,
  });

export const useInventoryLedger = (inventoryId, params = {}, options = {}) =>
  useQuery({
    queryKey: [QUERY_KEY, inventoryId, 'ledger', params],
    queryFn: async () => (await api.get(`/inventory/${inventoryId}/ledger`, { params })).data,
    enabled: Boolean(inventoryId),
    ...options,
  });

export const useRecentMovements = (limit = 10, options = {}) =>
  useQuery({
    queryKey: [QUERY_KEY, 'recent-movements', limit],
    queryFn: async () => (await api.get('/inventory/recent-movements', { params: { limit } })).data,
    ...options,
  });

export const useDashboardTotals = (options = {}) =>
  useQuery({
    queryKey: [QUERY_KEY, 'dashboard-totals'],
    queryFn: async () => (await api.get('/inventory/dashboard-totals')).data,
    ...options,
  });

export const useUpdateInventorySettings = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => api.put(`/inventory/${id}/settings`, payload),
    onSuccess: () => invalidate(queryClient),
  });
};

// Settings-only (minimumStock/maximumStock/reorderLevel) - quantities can
// never be bulk-imported, they only ever move through the ledger. See
// inventory.csv.js on the backend for why.
export const useImportInventorySettings = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file) => {
      const formData = new FormData();
      formData.append('file', file);
      return api.post('/inventory/import-settings', formData);
    },
    onSuccess: () => invalidate(queryClient),
  });
};
