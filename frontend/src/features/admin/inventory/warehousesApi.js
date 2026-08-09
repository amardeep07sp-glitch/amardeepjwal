import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

const QUERY_KEY = 'warehouses';

const invalidate = (queryClient) => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });

export const useWarehouses = (params = {}, options = {}) =>
  useQuery({
    queryKey: [QUERY_KEY, params],
    queryFn: async () => (await api.get('/warehouses', { params })).data,
    placeholderData: keepPreviousData,
    ...options,
  });

export const useAllWarehouses = (options = {}) =>
  useQuery({
    queryKey: [QUERY_KEY, 'all'],
    queryFn: async () => (await api.get('/warehouses/all')).data,
    ...options,
  });

export const useCreateWarehouse = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => api.post('/warehouses', payload),
    onSuccess: () => invalidate(queryClient),
  });
};

export const useUpdateWarehouse = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => api.put(`/warehouses/${id}`, payload),
    onSuccess: () => invalidate(queryClient),
  });
};

export const useDeleteWarehouse = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/warehouses/${id}`),
    onSuccess: () => invalidate(queryClient),
  });
};

export const useSetDefaultWarehouse = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.patch(`/warehouses/${id}/set-default`),
    onSuccess: () => invalidate(queryClient),
  });
};

export const useBulkUpdateWarehouseStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ids, status }) => api.patch('/warehouses/bulk-status', { ids, status }),
    onSuccess: () => invalidate(queryClient),
  });
};
