import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

const invalidateTickets = (queryClient) => queryClient.invalidateQueries({ queryKey: ['storefront', 'support', 'tickets'] });
const invalidateIssues = (queryClient) => queryClient.invalidateQueries({ queryKey: ['storefront', 'issues'] });

// ---- Support Tickets ----

export const useMyTickets = (params = {}, options = {}) =>
  useQuery({
    queryKey: ['storefront', 'support', 'tickets', params],
    queryFn: async () => (await api.get('/storefront/support/tickets', { params })).data,
    placeholderData: keepPreviousData,
    ...options,
  });

export const useMyTicket = (id, options = {}) =>
  useQuery({
    queryKey: ['storefront', 'support', 'tickets', id],
    queryFn: async () => (await api.get(`/storefront/support/tickets/${id}`)).data,
    enabled: Boolean(id),
    ...options,
  });

// `payload` is a FormData when attachments are present, a plain object
// otherwise - `api.post` already handles both (see lib/api.js).
export const useCreateMyTicket = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => api.post('/storefront/support/tickets', payload).then((res) => res.data),
    onSuccess: () => invalidateTickets(queryClient),
  });
};

export const useReplyToMyTicket = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => api.post(`/storefront/support/tickets/${id}/messages`, payload).then((res) => res.data),
    onSuccess: (_data, { id }) => queryClient.invalidateQueries({ queryKey: ['storefront', 'support', 'tickets', id] }),
  });
};

// ---- Issue Reports ----

export const useMyIssues = (params = {}, options = {}) =>
  useQuery({
    queryKey: ['storefront', 'issues', params],
    queryFn: async () => (await api.get('/storefront/issues', { params })).data,
    placeholderData: keepPreviousData,
    ...options,
  });

export const useMyIssue = (id, options = {}) =>
  useQuery({
    queryKey: ['storefront', 'issues', id],
    queryFn: async () => (await api.get(`/storefront/issues/${id}`)).data,
    enabled: Boolean(id),
    ...options,
  });

export const useCreateMyIssue = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => api.post('/storefront/issues', payload).then((res) => res.data),
    onSuccess: () => invalidateIssues(queryClient),
  });
};

// ---- Feedback ----

export const useSubmitFeedback = () =>
  useMutation({
    mutationFn: (payload) => api.post('/storefront/feedback', payload).then((res) => res.data),
  });
