import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

const QUERY_KEY = 'customer-referrals';

const invalidate = (queryClient) => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });

export const useReferrals = (params = {}, options = {}) =>
  useQuery({
    queryKey: [QUERY_KEY, params],
    queryFn: async () => (await api.get('/customer-referrals', { params })).data,
    placeholderData: keepPreviousData,
    ...options,
  });

export const useReferralsForReferrer = (referrerId, options = {}) =>
  useQuery({
    queryKey: [QUERY_KEY, 'referrer', referrerId],
    queryFn: async () => (await api.get(`/customer-referrals/referrer/${referrerId}`)).data,
    enabled: Boolean(referrerId),
    ...options,
  });

export const useCompleteReferral = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.patch(`/customer-referrals/${id}/complete`),
    onSuccess: () => invalidate(queryClient),
  });
};

export const useRewardReferral = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, rewardPoints }) => api.patch(`/customer-referrals/${id}/reward`, { rewardPoints }),
    onSuccess: () => invalidate(queryClient),
  });
};
