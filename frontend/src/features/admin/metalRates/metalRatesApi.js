import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

const QUERY_KEY = 'metal-rates';

export const useMetalRates = () =>
  useQuery({
    queryKey: [QUERY_KEY],
    queryFn: async () => (await api.get('/metal-rates')).data,
  });

export const useUpdateMetalRates = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => api.patch('/metal-rates', payload).then((res) => res.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
};
