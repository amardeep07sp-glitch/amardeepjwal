import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

const QUERY_KEY = 'support-tickets';

const invalidate = (queryClient) => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });

export const useTickets = (params = {}, options = {}) =>
  useQuery({
    queryKey: [QUERY_KEY, params],
    queryFn: async () => (await api.get('/support/tickets', { params })).data,
    placeholderData: keepPreviousData,
    ...options,
  });

export const useTicketDashboard = (options = {}) =>
  useQuery({
    queryKey: [QUERY_KEY, 'dashboard'],
    queryFn: async () => (await api.get('/support/tickets/dashboard')).data,
    ...options,
  });

export const useTicket = (id, options = {}) =>
  useQuery({
    queryKey: [QUERY_KEY, id],
    queryFn: async () => (await api.get(`/support/tickets/${id}`)).data,
    enabled: Boolean(id),
    ...options,
  });

export const useAssignTicket = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, agentUserId }) => api.patch(`/support/tickets/${id}/assign`, { agentUserId }),
    onSuccess: () => invalidate(queryClient),
  });
};

export const useUpdateTicketPriority = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, priority }) => api.patch(`/support/tickets/${id}/priority`, { priority }),
    onSuccess: () => invalidate(queryClient),
  });
};

export const useUpdateTicketStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, note }) => api.patch(`/support/tickets/${id}/status`, { status, note }),
    onSuccess: () => invalidate(queryClient),
  });
};

// FormData (not a plain object) since a reply can carry attachments -
// `api.post` already skips the JSON Content-Type header for FormData
// bodies (see lib/api.js), same convention media uploads elsewhere use.
export const useAddAgentMessage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, formData }) => api.post(`/support/tickets/${id}/messages`, formData),
    onSuccess: () => invalidate(queryClient),
  });
};

// ---- SLA policy (Phase 26/58) ----

export const useSlaPolicy = (options = {}) =>
  useQuery({
    queryKey: [QUERY_KEY, 'sla-policy'],
    queryFn: async () => (await api.get('/support/sla-policy')).data,
    ...options,
  });

export const useUpdateSlaPolicy = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (tiers) => api.put('/support/sla-policy', { tiers }).then((res) => res.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY, 'sla-policy'] }),
  });
};

// ---- Assignment rules (Phase 25) ----

export const useAssignmentRules = (options = {}) =>
  useQuery({
    queryKey: [QUERY_KEY, 'assignment-rules'],
    queryFn: async () => (await api.get('/support/assignment-rules')).data,
    ...options,
  });

export const useSetAssignmentRule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ category, agentUserId }) => api.put('/support/assignment-rules', { category, agentUserId }).then((res) => res.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY, 'assignment-rules'] }),
  });
};

export const useRemoveAssignmentRule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (category) => api.delete(`/support/assignment-rules/${category}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY, 'assignment-rules'] }),
  });
};

// ---- Staff directory (agent picker) ----

const SUPPORT_STAFF_ROLES = ['super_admin', 'admin', 'manager', 'staff', 'support_agent', 'support_manager'];

export const useStaffUsers = (search = '', options = {}) =>
  useQuery({
    queryKey: ['staff-users', search],
    queryFn: async () =>
      (await api.get('/auth/users', { params: { role: SUPPORT_STAFF_ROLES.join(','), search: search || undefined, limit: 50 } })).data,
    ...options,
  });
