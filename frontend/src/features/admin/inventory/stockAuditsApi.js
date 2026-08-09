import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

const QUERY_KEY = 'stock-audits';

const invalidate = (queryClient) => {
  queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
  queryClient.invalidateQueries({ queryKey: ['inventory'] });
};

export const useStockAudits = (params = {}, options = {}) =>
  useQuery({
    queryKey: [QUERY_KEY, params],
    queryFn: async () => (await api.get('/stock-audits', { params })).data,
    placeholderData: keepPreviousData,
    ...options,
  });

export const useCreateStockAudit = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => api.post('/stock-audits', payload),
    onSuccess: () => invalidate(queryClient),
  });
};

export const useCompleteStockAudit = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.patch(`/stock-audits/${id}/complete`),
    onSuccess: () => invalidate(queryClient),
  });
};
