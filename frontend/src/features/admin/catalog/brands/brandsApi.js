import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

const QUERY_KEY = 'brands';

const invalidate = (queryClient) => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });

export const useBrands = (params = {}, options = {}) =>
  useQuery({
    queryKey: [QUERY_KEY, params],
    queryFn: async () => (await api.get('/brands', { params })).data,
    placeholderData: keepPreviousData,
    ...options,
  });

export const useCreateBrand = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => api.post('/brands', payload),
    onSuccess: () => invalidate(queryClient),
  });
};

export const useUpdateBrand = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => api.put(`/brands/${id}`, payload),
    onSuccess: () => invalidate(queryClient),
  });
};

export const useDeleteBrand = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/brands/${id}`),
    onSuccess: () => invalidate(queryClient),
  });
};

export const useBulkDeleteBrands = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids) => api.post('/brands/bulk-delete', { ids }),
    onSuccess: () => invalidate(queryClient),
  });
};

export const useBulkUpdateBrandStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ids, status }) => api.patch('/brands/bulk-status', { ids, status }),
    onSuccess: () => invalidate(queryClient),
  });
};
