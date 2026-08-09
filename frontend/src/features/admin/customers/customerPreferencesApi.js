import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

const QUERY_KEY = 'customer-preferences';

export const usePreferences = (customerId, options = {}) =>
  useQuery({
    queryKey: [QUERY_KEY, customerId],
    queryFn: async () => (await api.get(`/customer-preferences/${customerId}`)).data,
    enabled: Boolean(customerId),
    ...options,
  });

export const useUpdatePreferences = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ customerId, ...payload }) => api.put(`/customer-preferences/${customerId}`, payload),
    onSuccess: (_, variables) => queryClient.invalidateQueries({ queryKey: [QUERY_KEY, variables.customerId] }),
  });
};
