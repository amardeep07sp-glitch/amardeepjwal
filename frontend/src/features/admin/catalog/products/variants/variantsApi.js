import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

const QUERY_KEY = 'product-variants';

const invalidate = (queryClient, productId) =>
  queryClient.invalidateQueries({ queryKey: [QUERY_KEY, productId] });

export const useVariants = (productId, params = {}) =>
  useQuery({
    queryKey: [QUERY_KEY, productId, params],
    queryFn: async () => (await api.get(`/products/${productId}/variants`, { params })).data,
    enabled: Boolean(productId),
    placeholderData: keepPreviousData,
  });

export const useCreateVariant = (productId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => api.post(`/products/${productId}/variants`, payload),
    onSuccess: () => invalidate(queryClient, productId),
  });
};

export const useUpdateVariant = (productId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ variantId, payload }) => api.put(`/products/${productId}/variants/${variantId}`, payload),
    onSuccess: () => invalidate(queryClient, productId),
  });
};

export const useDeleteVariant = (productId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (variantId) => api.delete(`/products/${productId}/variants/${variantId}`),
    onSuccess: () => invalidate(queryClient, productId),
  });
};

export const useBulkDeleteVariants = (productId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids) => api.post(`/products/${productId}/variants/bulk-delete`, { ids }),
    onSuccess: () => invalidate(queryClient, productId),
  });
};

export const useBulkUpdateVariantStatus = (productId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ids, status }) => api.patch(`/products/${productId}/variants/bulk-status`, { ids, status }),
    onSuccess: () => invalidate(queryClient, productId),
  });
};

export const useBulkDuplicateVariants = (productId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids) => api.post(`/products/${productId}/variants/bulk-duplicate`, { ids }),
    onSuccess: () => invalidate(queryClient, productId),
  });
};

export const useGenerateVariants = (productId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => api.post(`/products/${productId}/variants/generate`, payload),
    onSuccess: () => invalidate(queryClient, productId),
  });
};
