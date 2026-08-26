import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

const QUERY_KEY = 'help-articles';

const invalidate = (queryClient) => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });

export const useHelpArticlesAdmin = (params = {}, options = {}) =>
  useQuery({
    queryKey: [QUERY_KEY, params],
    queryFn: async () => (await api.get('/help/admin/articles', { params })).data,
    placeholderData: keepPreviousData,
    ...options,
  });

export const useHelpArticleAdmin = (id, options = {}) =>
  useQuery({
    queryKey: [QUERY_KEY, id],
    queryFn: async () => (await api.get(`/help/admin/articles/${id}`)).data,
    enabled: Boolean(id),
    ...options,
  });

export const useCreateHelpArticle = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => api.post('/help/admin/articles', payload),
    onSuccess: () => invalidate(queryClient),
  });
};

export const useUpdateHelpArticle = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => api.put(`/help/admin/articles/${id}`, payload),
    onSuccess: () => invalidate(queryClient),
  });
};

export const useDeleteHelpArticle = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/help/admin/articles/${id}`),
    onSuccess: () => invalidate(queryClient),
  });
};

// ---- Categories (Phase 4) ----

export const useHelpCategoriesAdmin = (options = {}) =>
  useQuery({
    queryKey: [QUERY_KEY, 'categories'],
    queryFn: async () => (await api.get('/help/admin/categories')).data,
    ...options,
  });

export const useUpdateHelpCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ code, payload }) => api.put(`/help/admin/categories/${code}`, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY, 'categories'] }),
  });
};

// ---- Search Analytics (Phase 4) ----

export const useHelpSearchAnalytics = (options = {}) =>
  useQuery({
    queryKey: [QUERY_KEY, 'search-analytics'],
    queryFn: async () => (await api.get('/help/admin/search-analytics')).data,
    ...options,
  });
