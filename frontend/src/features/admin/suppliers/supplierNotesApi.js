import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

const QUERY_KEY = 'supplier-notes';

export const useSupplierNotes = (supplierId, options = {}) =>
  useQuery({
    queryKey: [QUERY_KEY, supplierId],
    queryFn: async () => (await api.get(`/supplier-notes/supplier/${supplierId}`)).data,
    enabled: Boolean(supplierId),
    ...options,
  });

export const useCreateSupplierNote = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ supplierId, ...payload }) => api.post(`/supplier-notes/supplier/${supplierId}`, payload),
    onSuccess: (_, variables) => queryClient.invalidateQueries({ queryKey: [QUERY_KEY, variables.supplierId] }),
  });
};

export const useDeleteSupplierNote = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/supplier-notes/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
};
