import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

const QUERY_KEY = 'suppliers';

const invalidate = (queryClient) => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });

export const useSuppliers = (params = {}, options = {}) =>
  useQuery({
    queryKey: [QUERY_KEY, params],
    queryFn: async () => (await api.get('/suppliers', { params })).data,
    placeholderData: keepPreviousData,
    ...options,
  });

export const useSupplierById = (id, options = {}) =>
  useQuery({
    queryKey: [QUERY_KEY, id],
    queryFn: async () => (await api.get(`/suppliers/${id}`)).data,
    enabled: Boolean(id),
    ...options,
  });

export const useSupplierTimeline = (id, options = {}) =>
  useQuery({
    queryKey: [QUERY_KEY, id, 'timeline'],
    queryFn: async () => (await api.get(`/suppliers/${id}/timeline`)).data,
    enabled: Boolean(id),
    ...options,
  });

export const useSupplierActivity = (id, options = {}) =>
  useQuery({
    queryKey: [QUERY_KEY, id, 'activity'],
    queryFn: async () => (await api.get(`/suppliers/${id}/activity`)).data,
    enabled: Boolean(id),
    ...options,
  });

export const useSupplierDashboardTotals = (options = {}) =>
  useQuery({
    queryKey: [QUERY_KEY, 'dashboard-totals'],
    queryFn: async () => (await api.get('/suppliers/dashboard-totals')).data,
    ...options,
  });

export const useCreateSupplier = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => api.post('/suppliers', payload),
    onSuccess: () => invalidate(queryClient),
  });
};

export const useUpdateSupplier = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }) => api.put(`/suppliers/${id}`, payload),
    onSuccess: () => invalidate(queryClient),
  });
};

export const useDeleteSupplier = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/suppliers/${id}`),
    onSuccess: () => invalidate(queryClient),
  });
};
