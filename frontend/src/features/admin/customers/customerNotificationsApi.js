import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

const QUERY_KEY = 'customer-notifications';

export const useNotifications = (customerId, params = {}, options = {}) =>
  useQuery({
    queryKey: [QUERY_KEY, customerId, params],
    queryFn: async () => (await api.get(`/customer-notifications/${customerId}`, { params })).data,
    enabled: Boolean(customerId),
    ...options,
  });

export const useSendNotification = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ customerId, ...payload }) => api.post(`/customer-notifications/${customerId}/send`, payload),
    onSuccess: (_, variables) => queryClient.invalidateQueries({ queryKey: [QUERY_KEY, variables.customerId] }),
  });
};
