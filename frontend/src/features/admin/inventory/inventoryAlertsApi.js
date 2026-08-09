import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

const QUERY_KEY = 'inventory-alerts';

const invalidate = (queryClient) => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });

export const useInventoryAlerts = (params = {}, options = {}) =>
  useQuery({
    queryKey: [QUERY_KEY, params],
    queryFn: async () => (await api.get('/inventory-alerts', { params })).data,
    placeholderData: keepPreviousData,
    ...options,
  });

export const useAcknowledgeAlert = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.patch(`/inventory-alerts/${id}/acknowledge`),
    onSuccess: () => invalidate(queryClient),
  });
};

export const useResolveAlert = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.patch(`/inventory-alerts/${id}/resolve`),
    onSuccess: () => invalidate(queryClient),
  });
};
