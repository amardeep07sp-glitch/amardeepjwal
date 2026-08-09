import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

const QUERY_KEY = 'supplier-contacts';

export const useSupplierContacts = (supplierId, options = {}) =>
  useQuery({
    queryKey: [QUERY_KEY, supplierId],
    queryFn: async () => (await api.get(`/supplier-contacts/supplier/${supplierId}`)).data,
    enabled: Boolean(supplierId),
    ...options,
  });

export const useCreateSupplierContact = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ supplierId, ...payload }) => api.post(`/supplier-contacts/supplier/${supplierId}`, payload),
    onSuccess: (_, variables) => queryClient.invalidateQueries({ queryKey: [QUERY_KEY, variables.supplierId] }),
  });
};

export const useDeleteSupplierContact = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/supplier-contacts/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
};
