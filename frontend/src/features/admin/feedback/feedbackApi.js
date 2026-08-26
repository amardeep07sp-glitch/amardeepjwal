import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

const QUERY_KEY = 'feedback';

// Read-only admin surface - feedback is customer-submitted, never
// admin-edited (see backend feedback.routes.js's own header comment).
export const useFeedbackList = (params = {}, options = {}) =>
  useQuery({
    queryKey: [QUERY_KEY, params],
    queryFn: async () => (await api.get('/feedback', { params })).data,
    placeholderData: keepPreviousData,
    ...options,
  });

export const useFeedbackSummary = (options = {}) =>
  useQuery({
    queryKey: [QUERY_KEY, 'summary'],
    queryFn: async () => (await api.get('/feedback/summary')).data,
    ...options,
  });
