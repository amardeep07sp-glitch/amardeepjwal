import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

const QUERY_KEY = 'journals';

const invalidate = (queryClient) => {
  queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
  queryClient.invalidateQueries({ queryKey: ['accounts'] });
  queryClient.invalidateQueries({ queryKey: ['general-ledger'] });
};

export const useJournals = (params = {}, options = {}) =>
  useQuery({
    queryKey: [QUERY_KEY, params],
    queryFn: async () => (await api.get('/journals', { params })).data,
    placeholderData: keepPreviousData,
    ...options,
  });

export const useJournalById = (id, options = {}) =>
  useQuery({
    queryKey: [QUERY_KEY, id],
    queryFn: async () => (await api.get(`/journals/${id}`)).data,
    enabled: Boolean(id),
    ...options,
  });

export const useCreateManualJournal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => api.post('/journals', payload),
    onSuccess: () => invalidate(queryClient),
  });
};

export const useReverseJournal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }) => api.patch(`/journals/${id}/reverse`, { reason }),
    onSuccess: () => invalidate(queryClient),
  });
};
