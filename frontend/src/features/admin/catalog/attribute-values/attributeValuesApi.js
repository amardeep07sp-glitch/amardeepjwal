import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

const QUERY_KEY = 'attribute-values';

const invalidate = (queryClient) => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });

export const useAttributeValuesByAttribute = (attributeId) =>
  useQuery({
    queryKey: [QUERY_KEY, attributeId],
    queryFn: async () => (await api.get(`/attribute-values/by-attribute/${attributeId}`)).data,
    enabled: Boolean(attributeId),
  });

export const useCreateAttributeValue = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => api.post('/attribute-values', payload),
    onSuccess: () => invalidate(queryClient),
  });
};

export const useUpdateAttributeValue = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => api.put(`/attribute-values/${id}`, payload),
    onSuccess: () => invalidate(queryClient),
  });
};

export const useDeleteAttributeValue = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/attribute-values/${id}`),
    onSuccess: () => invalidate(queryClient),
  });
};
