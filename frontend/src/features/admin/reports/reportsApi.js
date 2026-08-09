import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

// One generic hook backs every report in the Reports Center - each report
// is just a GET with query params (date range / pagination / a couple of
// domain filters), so a per-report named hook would be pure duplication.
// Keyed by [endpoint, params] so TanStack Query caches/dedupes each report
// + filter combination independently.
export const useReportQuery = (endpoint, params = {}, options = {}) =>
  useQuery({
    queryKey: ['reports', endpoint, params],
    queryFn: async () => (await api.get(endpoint, { params })).data,
    enabled: Boolean(endpoint),
    placeholderData: keepPreviousData,
    ...options,
  });

export const useExecutiveDashboardCards = (options = {}) => useReportQuery('/executive-dashboard/cards', {}, options);
export const useExecutiveDashboardCharts = (days = 14, options = {}) => useReportQuery('/executive-dashboard/charts', { days }, options);

export const useSavedFilters = (reportKey, options = {}) =>
  useQuery({
    queryKey: ['saved-filters', reportKey],
    queryFn: async () => (await api.get('/saved-filters', { params: { reportKey } })).data,
    enabled: Boolean(reportKey),
    ...options,
  });

export const useCreateSavedFilter = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => api.post('/saved-filters', payload),
    onSuccess: (_, variables) => queryClient.invalidateQueries({ queryKey: ['saved-filters', variables.reportKey] }),
  });
};

export const useDeleteSavedFilter = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/saved-filters/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['saved-filters'] }),
  });
};
