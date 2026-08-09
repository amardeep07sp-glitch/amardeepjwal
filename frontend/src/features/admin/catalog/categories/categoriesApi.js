import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { downloadFile } from '@/lib/downloadFile';

const CATEGORIES_QUERY_KEY = 'categories';
const CATEGORY_TREE_QUERY_KEY = 'category-tree';
const CATEGORY_TRASH_QUERY_KEY = 'category-trash';

const invalidateCategoryQueries = (queryClient) => {
  queryClient.invalidateQueries({ queryKey: [CATEGORIES_QUERY_KEY] });
  queryClient.invalidateQueries({ queryKey: [CATEGORY_TREE_QUERY_KEY] });
  queryClient.invalidateQueries({ queryKey: [CATEGORY_TRASH_QUERY_KEY] });
};

export const useCategories = (params = {}, options = {}) =>
  useQuery({
    queryKey: [CATEGORIES_QUERY_KEY, params],
    queryFn: async () => (await api.get('/categories', { params })).data,
    placeholderData: keepPreviousData,
    ...options,
  });

export const useCategoryTree = (params = {}) =>
  useQuery({
    queryKey: [CATEGORY_TREE_QUERY_KEY, params],
    queryFn: async () => (await api.get('/categories/tree', { params })).data,
  });

export const useCategory = (id, options = {}) =>
  useQuery({
    queryKey: [CATEGORIES_QUERY_KEY, id],
    queryFn: async () => (await api.get(`/categories/${id}`)).data,
    enabled: Boolean(id),
    ...options,
  });

export const useCategoryBreadcrumb = (id, options = {}) =>
  useQuery({
    queryKey: [CATEGORIES_QUERY_KEY, id, 'breadcrumb'],
    queryFn: async () => (await api.get(`/categories/${id}/breadcrumb`)).data,
    enabled: Boolean(id),
    ...options,
  });

export const useTrashedCategories = (params = {}) =>
  useQuery({
    queryKey: [CATEGORY_TRASH_QUERY_KEY, params],
    queryFn: async () => (await api.get('/categories/trash', { params })).data,
    placeholderData: keepPreviousData,
  });

export const useCategoryActivity = (params = {}) =>
  useQuery({
    queryKey: ['category-activity', params],
    queryFn: async () => (await api.get('/activity-logs', { params: { ...params, module: 'category' } })).data,
    placeholderData: keepPreviousData,
  });

export const useCategorySearch = (searchTerm, options = {}) =>
  useQuery({
    queryKey: [CATEGORIES_QUERY_KEY, 'autocomplete', searchTerm],
    queryFn: async () => (await api.get('/categories/autocomplete', { params: { q: searchTerm } })).data,
    enabled: Boolean(searchTerm),
    ...options,
  });

export const exportCategoriesCsv = () =>
  downloadFile('/categories/export', { filename: `categories-export-${Date.now()}.csv` });

export const useImportCategories = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file) => {
      const formData = new FormData();
      formData.append('file', file);
      return api.post('/categories/import', formData);
    },
    onSuccess: () => invalidateCategoryQueries(queryClient),
  });
};

export const useCreateCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => api.post('/categories', payload),
    onSuccess: () => invalidateCategoryQueries(queryClient),
  });
};

export const useUpdateCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => api.put(`/categories/${id}`, payload),
    onSuccess: () => invalidateCategoryQueries(queryClient),
  });
};

export const useUpdateCategoryStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }) => api.patch(`/categories/${id}/status`, { status }),
    onSuccess: () => invalidateCategoryQueries(queryClient),
  });
};

export const useReorderCategories = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (updates) => api.patch('/categories/reorder', { updates }),
    onSuccess: () => invalidateCategoryQueries(queryClient),
  });
};

export const useDeleteCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/categories/${id}`),
    onSuccess: () => invalidateCategoryQueries(queryClient),
  });
};

export const useRestoreCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.post(`/categories/${id}/restore`),
    onSuccess: () => invalidateCategoryQueries(queryClient),
  });
};

export const usePermanentlyDeleteCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/categories/${id}/permanent`),
    onSuccess: () => invalidateCategoryQueries(queryClient),
  });
};

export const useBulkDeleteCategories = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids) => api.post('/categories/bulk-delete', { ids }),
    onSuccess: () => invalidateCategoryQueries(queryClient),
  });
};

export const useBulkUpdateCategoryStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ids, status }) => api.patch('/categories/bulk-status', { ids, status }),
    onSuccess: () => invalidateCategoryQueries(queryClient),
  });
};

export const useDuplicateCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.post(`/categories/${id}/duplicate`),
    onSuccess: () => invalidateCategoryQueries(queryClient),
  });
};

export const useMergeCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ sourceId, targetId }) => api.post(`/categories/${sourceId}/merge`, { targetId }),
    onSuccess: () => invalidateCategoryQueries(queryClient),
  });
};

export const useCategoryAnalytics = (params = {}) =>
  useQuery({
    queryKey: ['category-analytics', params],
    queryFn: async () => (await api.get('/categories/analytics', { params })).data,
    placeholderData: keepPreviousData,
  });
