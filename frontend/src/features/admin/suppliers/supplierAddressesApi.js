import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

const QUERY_KEY = 'supplier-addresses';

const invalidate = (queryClient, supplierId) => queryClient.invalidateQueries({ queryKey: [QUERY_KEY, supplierId] });

export const useAddressesForSupplier = (supplierId, options = {}) =>
  useQuery({
    queryKey: [QUERY_KEY, supplierId],
    queryFn: async () => (await api.get(`/supplier-addresses/supplier/${supplierId}`)).data,
    enabled: Boolean(supplierId),
    ...options,
  });

export const useCreateSupplierAddress = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ supplier, ...payload }) => api.post(`/supplier-addresses/supplier/${supplier}`, payload),
    onSuccess: (_, variables) => invalidate(queryClient, variables.supplier),
  });
};

export const useUpdateSupplierAddress = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }) => api.put(`/supplier-addresses/${id}`, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
};

export const useDeleteSupplierAddress = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/supplier-addresses/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
};
