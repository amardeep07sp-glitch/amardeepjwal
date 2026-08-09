import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

const QUERY_KEY = 'products';

const invalidate = (queryClient) => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });

export const useProducts = (params = {}, options = {}) =>
  useQuery({
    queryKey: [QUERY_KEY, params],
    queryFn: async () => (await api.get('/products', { params })).data,
    placeholderData: keepPreviousData,
    ...options,
  });

export const useCreateProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => api.post('/products', payload),
    onSuccess: () => invalidate(queryClient),
  });
};

export const useUpdateProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => api.put(`/products/${id}`, payload),
    onSuccess: () => invalidate(queryClient),
  });
};

export const useDeleteProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/products/${id}`),
    onSuccess: () => invalidate(queryClient),
  });
};

export const useBulkDeleteProducts = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids) => api.post('/products/bulk-delete', { ids }),
    onSuccess: () => invalidate(queryClient),
  });
};

export const useBulkUpdateProductStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ids, status }) => api.patch('/products/bulk-status', { ids, status }),
    onSuccess: () => invalidate(queryClient),
  });
};

export const useDuplicateProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.post(`/products/${id}/duplicate`),
    onSuccess: () => invalidate(queryClient),
  });
};

// Preview only - the real SKU is (re-)derived fresh at actual create time
// (see product.service.js#previewNextSku), this just shows the admin what
// to expect while filling out the New Product form.
export const useNextSku = (category, options = {}) =>
  useQuery({
    queryKey: [QUERY_KEY, 'next-sku', category],
    queryFn: async () => (await api.get('/products/next-sku', { params: { category } })).data,
    enabled: Boolean(category),
    ...options,
  });

export const useOverrideSku = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, sku }) => api.patch(`/products/${id}/sku`, { sku }),
    onSuccess: () => invalidate(queryClient),
  });
};
