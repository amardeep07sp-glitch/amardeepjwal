import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

const QUERY_KEY = 'attribute-groups';

const invalidate = (queryClient) => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });

export const useAttributeGroups = (params = {}, options = {}) =>
  useQuery({
    queryKey: [QUERY_KEY, params],
    queryFn: async () => (await api.get('/attribute-groups', { params })).data,
    placeholderData: keepPreviousData,
    ...options,
  });

export const useAllAttributeGroups = () =>
  useQuery({
    queryKey: [QUERY_KEY, 'all'],
    queryFn: async () => (await api.get('/attribute-groups/all')).data,
  });

export const useCreateAttributeGroup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => api.post('/attribute-groups', payload),
    onSuccess: () => invalidate(queryClient),
  });
};

export const useUpdateAttributeGroup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => api.put(`/attribute-groups/${id}`, payload),
    onSuccess: () => invalidate(queryClient),
  });
};

export const useDeleteAttributeGroup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/attribute-groups/${id}`),
    onSuccess: () => invalidate(queryClient),
  });
};
