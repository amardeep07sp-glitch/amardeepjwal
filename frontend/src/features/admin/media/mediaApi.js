import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

const QUERY_KEY = 'media';

const scopeKey = (entityType, entityId, variantId) => [QUERY_KEY, entityType, entityId, variantId ?? null];

const invalidateScope = (queryClient, entityType, entityId, variantId) =>
  queryClient.invalidateQueries({ queryKey: scopeKey(entityType, entityId, variantId) });

export const useMedia = (entityType, entityId, variantId, params = {}) =>
  useQuery({
    queryKey: [...scopeKey(entityType, entityId, variantId), params],
    queryFn: async () =>
      (
        await api.get('/media', {
          params: { entityType, entityId, variantId: variantId || undefined, limit: 100, ...params },
        })
      ).data,
    enabled: Boolean(entityType && entityId),
  });

export const useMediaLibrary = (params = {}, options = {}) =>
  useQuery({
    queryKey: [QUERY_KEY, 'library', params],
    queryFn: async () => (await api.get('/media/library', { params })).data,
    ...options,
  });

export const useUploadMedia = (entityType, entityId, variantId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (formData) => api.post('/media/upload', formData),
    onSuccess: () => invalidateScope(queryClient, entityType, entityId, variantId),
  });
};

export const useUpdateMediaMetadata = (entityType, entityId, variantId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => api.put(`/media/${id}`, payload),
    onSuccess: () => invalidateScope(queryClient, entityType, entityId, variantId),
  });
};

export const useReplaceMedia = (entityType, entityId, variantId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, formData }) => api.post(`/media/${id}/replace`, formData),
    onSuccess: () => invalidateScope(queryClient, entityType, entityId, variantId),
  });
};

export const useDeleteMedia = (entityType, entityId, variantId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, force } = {}) => api.delete(`/media/${id}`, { params: { force: force || undefined } }),
    onSuccess: () => invalidateScope(queryClient, entityType, entityId, variantId),
  });
};

export const useBulkDeleteMedia = (entityType, entityId, variantId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ids, force } = {}) => api.post('/media/bulk-delete', { ids, force: force || undefined }),
    onSuccess: () => invalidateScope(queryClient, entityType, entityId, variantId),
  });
};

export const useBulkArchiveMedia = (entityType, entityId, variantId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids) => api.patch('/media/bulk-archive', { ids }),
    onSuccess: () => invalidateScope(queryClient, entityType, entityId, variantId),
  });
};

export const useBulkRestoreMedia = (entityType, entityId, variantId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids) => api.patch('/media/bulk-restore', { ids }),
    onSuccess: () => invalidateScope(queryClient, entityType, entityId, variantId),
  });
};

export const useMediaDetails = (id, options = {}) =>
  useQuery({
    queryKey: [QUERY_KEY, 'details', id],
    queryFn: async () => (await api.get(`/media/${id}/details`)).data,
    enabled: Boolean(id),
    ...options,
  });

export const useMediaUsage = (id, options = {}) =>
  useQuery({
    queryKey: [QUERY_KEY, 'usage', id],
    queryFn: async () => (await api.get(`/media/${id}/usage`)).data,
    enabled: Boolean(id),
    ...options,
  });

export const useReorderMedia = (entityType, entityId, variantId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (items) => api.patch('/media/reorder', { items }),
    onSuccess: () => invalidateScope(queryClient, entityType, entityId, variantId),
  });
};
