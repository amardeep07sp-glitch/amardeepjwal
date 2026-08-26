import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

const QUERY_KEY = 'broadcasts';

const invalidate = (queryClient) => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });

export const useBroadcasts = (params = {}, options = {}) =>
  useQuery({
    queryKey: [QUERY_KEY, params],
    queryFn: async () => (await api.get('/broadcasts', { params })).data,
    placeholderData: keepPreviousData,
    ...options,
  });

// A just-created broadcast sends in the background - the compose page
// polls this while status is 'pending'/'sending' to show live progress
// instead of the create request blocking on however long a full customer
// list takes to email/WhatsApp.
export const useBroadcast = (id, options = {}) =>
  useQuery({
    queryKey: [QUERY_KEY, id],
    queryFn: async () => (await api.get(`/broadcasts/${id}`)).data,
    enabled: Boolean(id),
    ...options,
  });

export const useCreateBroadcast = () => {
  const queryClient = useQueryClient();
  return useMutation({
    // Unwrapped (not the raw ApiResponse) - the compose page needs the new
    // broadcast's id straight off the mutation result to start polling
    // useBroadcast(id) for live send progress.
    mutationFn: async (payload) => (await api.post('/broadcasts', payload)).data,
    onSuccess: () => invalidate(queryClient),
  });
};

export const useDeactivateBroadcast = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.patch(`/broadcasts/${id}/deactivate`),
    onSuccess: () => invalidate(queryClient),
  });
};
