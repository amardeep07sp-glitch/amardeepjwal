import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

const QUERY_KEY = 'barcodes';

const invalidate = (queryClient) => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });

export const useBarcodes = (params = {}, options = {}) =>
  useQuery({
    queryKey: [QUERY_KEY, params],
    queryFn: async () => (await api.get('/barcodes', { params })).data,
    placeholderData: keepPreviousData,
    ...options,
  });

export const useGenerateBarcode = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => api.post('/barcodes/generate', payload),
    onSuccess: () => invalidate(queryClient),
  });
};

export const useRegenerateBarcode = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => api.post('/barcodes/regenerate', payload),
    onSuccess: () => invalidate(queryClient),
  });
};

export const useDeleteBarcode = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/barcodes/${id}`),
    onSuccess: () => invalidate(queryClient),
  });
};
