import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

const QUERY_KEY = 'campaigns';

const invalidate = (queryClient) => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });

export const useCampaigns = (params = {}, options = {}) =>
  useQuery({
    queryKey: [QUERY_KEY, params],
    queryFn: async () => (await api.get('/promotions/campaigns', { params })).data,
    placeholderData: keepPreviousData,
    ...options,
  });

// Cheap, unpaginated fetch used by the coupon form's campaign picker -
// mirrors the same "active-only, high limit" convention other cross-form
// reference pickers (e.g. brand/category selects) already use.
export const useAllCampaigns = (options = {}) =>
  useQuery({
    queryKey: [QUERY_KEY, 'all'],
    queryFn: async () => (await api.get('/promotions/campaigns', { params: { limit: 100 } })).data,
    ...options,
  });

export const useCreateCampaign = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => api.post('/promotions/campaigns', payload),
    onSuccess: () => invalidate(queryClient),
  });
};

export const useUpdateCampaign = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => api.patch(`/promotions/campaigns/${id}`, payload),
    onSuccess: () => invalidate(queryClient),
  });
};

export const useSetCampaignStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }) => api.patch(`/promotions/campaigns/${id}/status`, { status }),
    onSuccess: () => invalidate(queryClient),
  });
};

export const useDeleteCampaign = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/promotions/campaigns/${id}`),
    onSuccess: () => invalidate(queryClient),
  });
};
