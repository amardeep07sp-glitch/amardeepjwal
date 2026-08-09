import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

const QUERY_KEY = 'collections';

const invalidate = (queryClient) => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });

export const useCollections = (params = {}, options = {}) =>
  useQuery({
    queryKey: [QUERY_KEY, params],
    queryFn: async () => (await api.get('/collections', { params })).data,
    placeholderData: keepPreviousData,
    ...options,
  });

export const useCreateCollection = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => api.post('/collections', payload),
    onSuccess: () => invalidate(queryClient),
  });
};

export const useUpdateCollection = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => api.put(`/collections/${id}`, payload),
    onSuccess: () => invalidate(queryClient),
  });
};

export const useDeleteCollection = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/collections/${id}`),
    onSuccess: () => invalidate(queryClient),
  });
};

export const useBulkDeleteCollections = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids) => api.post('/collections/bulk-delete', { ids }),
    onSuccess: () => invalidate(queryClient),
  });
};

export const useBulkUpdateCollectionStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ids, status }) => api.patch('/collections/bulk-status', { ids, status }),
    onSuccess: () => invalidate(queryClient),
  });
};

export const useDuplicateCollection = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.post(`/collections/${id}/duplicate`),
    onSuccess: () => invalidate(queryClient),
  });
};

// The Rule Builder's live "≈N products match" indicator - a cheap count,
// never a full fetch. Caller debounces (rules change on every keystroke).
export const usePreviewRuleMatches = (rules, options = {}) =>
  useQuery({
    queryKey: [QUERY_KEY, 'preview-rules', rules],
    queryFn: async () => (await api.post('/collections/preview-rules', rules)).data,
    ...options,
  });

// The Merchandising/Preview tabs paging through a collection's
// already-resolved product list (manual or rule-based, same orchestrator
// the public storefront uses).
export const useCollectionProducts = (id, params = {}, options = {}) =>
  useQuery({
    queryKey: [QUERY_KEY, id, 'products', params],
    queryFn: async () => (await api.get(`/collections/${id}/products`, { params })).data,
    enabled: Boolean(id),
    placeholderData: keepPreviousData,
    ...options,
  });

export const useReorderCollectionProducts = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, orderedIds }) => api.patch(`/collections/${id}/products/reorder`, { orderedIds }),
    onSuccess: (_, { id }) => queryClient.invalidateQueries({ queryKey: [QUERY_KEY, id, 'products'] }),
  });
};

// The Analytics tab - real collection_view/banner_click data from the CIP
// reports surface, once any exists.
export const useCollectionPerformance = (params = {}) =>
  useQuery({
    queryKey: [QUERY_KEY, 'performance', params],
    queryFn: async () => (await api.get('/cip/reports/collections/performance', { params })).data,
  });

export const useCollectionDashboardStats = () =>
  useQuery({
    queryKey: [QUERY_KEY, 'dashboard-stats'],
    queryFn: async () => (await api.get('/collections/dashboard-stats')).data,
  });
