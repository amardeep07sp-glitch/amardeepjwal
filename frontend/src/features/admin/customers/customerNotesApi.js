import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

const QUERY_KEY = 'customer-notes';

export const useNotes = (customerId, options = {}) =>
  useQuery({
    queryKey: [QUERY_KEY, customerId],
    queryFn: async () => (await api.get(`/customer-notes/customer/${customerId}`)).data,
    enabled: Boolean(customerId),
    ...options,
  });

export const useCreateNote = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ customerId, ...payload }) => api.post(`/customer-notes/customer/${customerId}`, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, variables.customerId] });
      queryClient.invalidateQueries({ queryKey: ['customers', variables.customerId, 'timeline'] });
    },
  });
};

export const useUpdateNote = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }) => api.put(`/customer-notes/${id}`, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
};

export const useDeleteNote = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/customer-notes/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
};
