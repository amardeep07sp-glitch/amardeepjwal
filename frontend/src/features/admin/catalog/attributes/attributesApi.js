import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

const QUERY_KEY = 'attributes';

const invalidate = (queryClient) => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });

export const useAttributes = (params = {}, options = {}) =>
  useQuery({
    queryKey: [QUERY_KEY, params],
    queryFn: async () => (await api.get('/attributes', { params })).data,
    placeholderData: keepPreviousData,
    ...options,
  });

export const useAllAttributes = (params = {}) =>
  useQuery({
    queryKey: [QUERY_KEY, 'all', params],
    queryFn: async () => (await api.get('/attributes/all', { params })).data,
  });

export const useCreateAttribute = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => api.post('/attributes', payload),
    onSuccess: () => invalidate(queryClient),
  });
};

export const useUpdateAttribute = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => api.put(`/attributes/${id}`, payload),
    onSuccess: () => invalidate(queryClient),
  });
};

export const useDeleteAttribute = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/attributes/${id}`),
    onSuccess: () => invalidate(queryClient),
  });
};
