import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

const QUERY_KEY = 'issue-reports';

const invalidate = (queryClient) => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });

export const useIssues = (params = {}, options = {}) =>
  useQuery({
    queryKey: [QUERY_KEY, params],
    queryFn: async () => (await api.get('/issues', { params })).data,
    placeholderData: keepPreviousData,
    ...options,
  });

export const useIssue = (id, options = {}) =>
  useQuery({
    queryKey: [QUERY_KEY, id],
    queryFn: async () => (await api.get(`/issues/${id}`)).data,
    enabled: Boolean(id),
    ...options,
  });

export const useAssignIssue = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, assigneeUserId }) => api.patch(`/issues/${id}/assign`, { assigneeUserId }),
    onSuccess: () => invalidate(queryClient),
  });
};

export const useUpdateIssueStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, resolutionNote }) => api.patch(`/issues/${id}/status`, { status, resolutionNote }),
    onSuccess: () => invalidate(queryClient),
  });
};
