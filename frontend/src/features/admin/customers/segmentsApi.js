import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

const QUERY_KEY = 'customer-segments';

const invalidate = (queryClient) => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });

export const useSegments = (options = {}) =>
  useQuery({
    queryKey: [QUERY_KEY],
    queryFn: async () => (await api.get('/customer-segments')).data,
    ...options,
  });

export const useCreateSegment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => api.post('/customer-segments', payload),
    onSuccess: () => invalidate(queryClient),
  });
};

export const useUpdateSegment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }) => api.put(`/customer-segments/${id}`, payload),
    onSuccess: () => invalidate(queryClient),
  });
};

export const useDeleteSegment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/customer-segments/${id}`),
    onSuccess: () => invalidate(queryClient),
  });
};
