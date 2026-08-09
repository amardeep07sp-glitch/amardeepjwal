import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

const QUERY_KEY = 'customer-tags';

const invalidate = (queryClient) => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });

export const useTags = (options = {}) =>
  useQuery({
    queryKey: [QUERY_KEY],
    queryFn: async () => (await api.get('/customer-tags')).data,
    ...options,
  });

export const useCreateTag = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => api.post('/customer-tags', payload),
    onSuccess: () => invalidate(queryClient),
  });
};

export const useUpdateTag = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }) => api.put(`/customer-tags/${id}`, payload),
    onSuccess: () => invalidate(queryClient),
  });
};

export const useDeleteTag = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/customer-tags/${id}`),
    onSuccess: () => invalidate(queryClient),
  });
};
