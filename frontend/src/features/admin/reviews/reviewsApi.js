import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

const QUERY_KEY = 'reviews';

export const useReviews = (params = {}, options = {}) =>
  useQuery({
    queryKey: [QUERY_KEY, params],
    queryFn: async () => (await api.get('/reviews', { params })).data,
    placeholderData: keepPreviousData,
    ...options,
  });

export const useModerateReview = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }) => api.patch(`/reviews/${id}/status`, { status }).then((res) => res.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
};

export const useDeleteReview = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/reviews/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
};

// ---- Phase 18: Review reporting queue ----

export const useReportedReviews = (params = {}, options = {}) =>
  useQuery({
    queryKey: [QUERY_KEY, 'reported', params],
    queryFn: async () => (await api.get('/reviews/reported', { params })).data,
    placeholderData: keepPreviousData,
    ...options,
  });

export const useReviewReports = (reviewId, options = {}) =>
  useQuery({
    queryKey: [QUERY_KEY, reviewId, 'reports'],
    queryFn: async () => (await api.get(`/reviews/${reviewId}/reports`)).data,
    enabled: Boolean(reviewId),
    ...options,
  });

export const useDismissReviewReport = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (reportId) => api.patch(`/reviews/reports/${reportId}/dismiss`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
};
