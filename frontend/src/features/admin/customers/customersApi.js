import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

const QUERY_KEY = 'customers';

const invalidate = (queryClient) => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });

export const useCustomers = (params = {}, options = {}) =>
  useQuery({
    queryKey: [QUERY_KEY, params],
    queryFn: async () => (await api.get('/customers', { params })).data,
    placeholderData: keepPreviousData,
    ...options,
  });

export const useCustomerById = (id, options = {}) =>
  useQuery({
    queryKey: [QUERY_KEY, id],
    queryFn: async () => (await api.get(`/customers/${id}`)).data,
    enabled: Boolean(id),
    ...options,
  });

export const useCustomerTimeline = (id, options = {}) =>
  useQuery({
    queryKey: [QUERY_KEY, id, 'timeline'],
    queryFn: async () => (await api.get(`/customers/${id}/timeline`)).data,
    enabled: Boolean(id),
    ...options,
  });

export const useCustomerActivity = (id, options = {}) =>
  useQuery({
    queryKey: [QUERY_KEY, id, 'activity'],
    queryFn: async () => (await api.get(`/customers/${id}/activity`)).data,
    enabled: Boolean(id),
    ...options,
  });

export const useDashboardTotals = (options = {}) =>
  useQuery({
    queryKey: [QUERY_KEY, 'dashboard-totals'],
    queryFn: async () => (await api.get('/customers/dashboard-totals')).data,
    ...options,
  });

export const useGrowthTrend = (days = 14, options = {}) =>
  useQuery({
    queryKey: [QUERY_KEY, 'growth-trend', days],
    queryFn: async () => (await api.get('/customers/growth-trend', { params: { days } })).data,
    ...options,
  });

export const useQuickCreateCustomer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => api.post('/customers', payload),
    onSuccess: () => invalidate(queryClient),
  });
};

export const useCreateCustomer = useQuickCreateCustomer;

export const useUpdateCustomer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }) => api.put(`/customers/${id}`, payload),
    onSuccess: () => invalidate(queryClient),
  });
};

export const useDeleteCustomer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/customers/${id}`),
    onSuccess: () => invalidate(queryClient),
  });
};

export const useBulkUpdateCustomerStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => api.patch('/customers/bulk-status', payload),
    onSuccess: () => invalidate(queryClient),
  });
};

export const useAssignTag = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, tagId }) => api.post(`/customers/${id}/tags/${tagId}`),
    onSuccess: () => invalidate(queryClient),
  });
};

export const useRemoveTag = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, tagId }) => api.delete(`/customers/${id}/tags/${tagId}`),
    onSuccess: () => invalidate(queryClient),
  });
};

export const useAssignSegment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, segmentId }) => api.post(`/customers/${id}/segments/${segmentId}`),
    onSuccess: () => invalidate(queryClient),
  });
};

export const useRemoveSegment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, segmentId }) => api.delete(`/customers/${id}/segments/${segmentId}`),
    onSuccess: () => invalidate(queryClient),
  });
};
