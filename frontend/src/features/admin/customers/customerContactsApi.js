import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

const QUERY_KEY = 'customer-contacts';

export const useContacts = (customerId, options = {}) =>
  useQuery({
    queryKey: [QUERY_KEY, customerId],
    queryFn: async () => (await api.get(`/customer-contacts/customer/${customerId}`)).data,
    enabled: Boolean(customerId),
    ...options,
  });

export const useCreateContact = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ customerId, ...payload }) => api.post(`/customer-contacts/customer/${customerId}`, payload),
    onSuccess: (_, variables) => queryClient.invalidateQueries({ queryKey: [QUERY_KEY, variables.customerId] }),
  });
};

export const useUpdateContact = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }) => api.put(`/customer-contacts/${id}`, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
};

export const useDeleteContact = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/customer-contacts/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
};
