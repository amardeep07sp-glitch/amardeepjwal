import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

const SETTINGS_QUERY_KEY = 'settings';

export const useSettings = () =>
  useQuery({
    queryKey: [SETTINGS_QUERY_KEY],
    queryFn: async () => (await api.get('/settings')).data,
  });

export const useUpdateSettings = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => api.patch('/settings', payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [SETTINGS_QUERY_KEY] }),
  });
};
