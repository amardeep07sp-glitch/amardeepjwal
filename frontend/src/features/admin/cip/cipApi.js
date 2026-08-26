import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

const QUERY_KEY = 'cip-dashboard';

export const useCipDashboardCards = (options = {}) =>
  useQuery({ queryKey: [QUERY_KEY, 'cards'], queryFn: async () => (await api.get('/cip/dashboard/cards')).data, refetchInterval: 30000, ...options });

export const useCipDashboardWidgets = (days = 14, options = {}) =>
  useQuery({ queryKey: [QUERY_KEY, 'widgets', days], queryFn: async () => (await api.get('/cip/dashboard/widgets', { params: { days } })).data, ...options });

// Segmentation
export const useSegmentCounts = (options = {}) =>
  useQuery({ queryKey: ['cip-segments', 'counts'], queryFn: async () => (await api.get('/cip/segments/counts')).data, ...options });

export const useSegmentMembers = (segmentKey, params = {}, options = {}) =>
  useQuery({
    queryKey: ['cip-segments', segmentKey, params],
    queryFn: async () => (await api.get(`/cip/segments/${segmentKey}`, { params })).data,
    enabled: Boolean(segmentKey),
    ...options,
  });

export const useRecomputeSegments = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.post('/cip/segments/recompute'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cip-segments'] }),
  });
};

// Location Intelligence (login GPS points, login/order state breakdowns)
export const useLoginLocationPoints = (options = {}) =>
  useQuery({ queryKey: ['cip-locations', 'logins', 'points'], queryFn: async () => (await api.get('/cip/reports/locations/logins')).data, ...options });

export const useLoginLocationStates = (options = {}) =>
  useQuery({ queryKey: ['cip-locations', 'logins', 'states'], queryFn: async () => (await api.get('/cip/reports/locations/logins/states')).data, ...options });

export const useOrderLocationStates = (params = {}, options = {}) =>
  useQuery({
    queryKey: ['cip-locations', 'orders', 'states', params],
    queryFn: async () => (await api.get('/cip/reports/locations/orders/states', { params })).data,
    ...options,
  });

export const useVisitLocationReport = (params = {}, options = {}) =>
  useQuery({
    queryKey: ['cip-locations', 'visits', params],
    queryFn: async () => (await api.get('/cip/reports/locations', { params })).data,
    ...options,
  });

// Campaign spend (for ROAS)
export const useCampaignSpend = (options = {}) =>
  useQuery({ queryKey: ['cip-campaign-spend'], queryFn: async () => (await api.get('/cip/campaign-spend')).data, ...options });

export const useCreateCampaignSpend = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => api.post('/cip/campaign-spend', payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cip-campaign-spend'] }),
  });
};

export const useDeleteCampaignSpend = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/cip/campaign-spend/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cip-campaign-spend'] }),
  });
};
