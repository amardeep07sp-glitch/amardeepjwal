import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

// Public Help Center reads - no auth required (see backend help.routes.js).
export const useHelpCategories = (options = {}) =>
  useQuery({
    queryKey: ['help', 'categories'],
    queryFn: async () => (await api.get('/help/categories')).data,
    staleTime: 5 * 60 * 1000,
    ...options,
  });

export const useHelpArticles = (params = {}, options = {}) =>
  useQuery({
    queryKey: ['help', 'articles', params],
    queryFn: async () => (await api.get('/help/articles', { params })).data,
    placeholderData: keepPreviousData,
    ...options,
  });

export const useFeaturedHelpArticles = (limit = 6, options = {}) =>
  useQuery({
    queryKey: ['help', 'articles', 'featured', limit],
    queryFn: async () => (await api.get('/help/articles/featured', { params: { limit } })).data,
    staleTime: 5 * 60 * 1000,
    ...options,
  });

export const useHelpSearch = (query, options = {}) =>
  useQuery({
    queryKey: ['help', 'search', query],
    queryFn: async () => (await api.get('/help/search', { params: { search: query } })).data,
    enabled: Boolean(query?.trim()),
    ...options,
  });

export const useHelpArticle = (slug, options = {}) =>
  useQuery({
    queryKey: ['help', 'articles', slug],
    queryFn: async () => (await api.get(`/help/articles/${slug}`)).data,
    enabled: Boolean(slug),
    ...options,
  });

export const useVoteHelpArticleHelpful = () =>
  useMutation({
    mutationFn: ({ slug, helpful }) => api.post(`/help/articles/${slug}/helpful`, { helpful }).then((res) => res.data),
  });
