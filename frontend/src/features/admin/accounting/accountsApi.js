import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

const QUERY_KEY = 'accounts';

const invalidate = (queryClient) => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });

export const useAccounts = (params = {}, options = {}) =>
  useQuery({
    queryKey: [QUERY_KEY, params],
    queryFn: async () => (await api.get('/accounts', { params })).data,
    placeholderData: keepPreviousData,
    ...options,
  });

export const useAllAccounts = (type, options = {}) =>
  useQuery({
    queryKey: [QUERY_KEY, 'all', type],
    queryFn: async () => (await api.get('/accounts/all', { params: type ? { type } : {} })).data,
    ...options,
  });

export const useAccountById = (id, options = {}) =>
  useQuery({
    queryKey: [QUERY_KEY, id],
    queryFn: async () => (await api.get(`/accounts/${id}`)).data,
    enabled: Boolean(id),
    ...options,
  });

export const useCreateAccount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => api.post('/accounts', payload),
    onSuccess: () => invalidate(queryClient),
  });
};

export const useUpdateAccount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }) => api.put(`/accounts/${id}`, payload),
    onSuccess: () => invalidate(queryClient),
  });
};

export const useDeleteAccount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/accounts/${id}`),
    onSuccess: () => invalidate(queryClient),
  });
};
