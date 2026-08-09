import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

const QUERY_KEY = 'addresses';

export const useAddressesForCustomer = (customerId, options = {}) =>
  useQuery({
    queryKey: [QUERY_KEY, 'customer', customerId],
    queryFn: async () => (await api.get(`/addresses/customer/${customerId}`)).data,
    enabled: Boolean(customerId),
    ...options,
  });

export const useCreateAddress = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => api.post('/addresses', payload),
    onSuccess: (_, variables) => queryClient.invalidateQueries({ queryKey: [QUERY_KEY, 'customer', variables.customer] }),
  });
};

export const useUpdateAddress = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }) => api.put(`/addresses/${id}`, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
};

export const useDeleteAddress = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/addresses/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
};
