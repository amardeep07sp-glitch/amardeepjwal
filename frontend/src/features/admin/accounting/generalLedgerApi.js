import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

const QUERY_KEY = 'general-ledger';

export const useAccountLedger = (accountId, params = {}, options = {}) =>
  useQuery({
    queryKey: [QUERY_KEY, 'account', accountId, params],
    queryFn: async () => (await api.get(`/general-ledger/account/${accountId}`, { params })).data,
    enabled: Boolean(accountId),
    ...options,
  });

export const useTrialBalance = (params = {}, options = {}) =>
  useQuery({
    queryKey: [QUERY_KEY, 'trial-balance', params],
    queryFn: async () => (await api.get('/general-ledger/trial-balance', { params })).data,
    ...options,
  });
