import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

const QUERY_KEY = 'financial-reports';

export const useProfitAndLoss = (params = {}, options = {}) =>
  useQuery({ queryKey: [QUERY_KEY, 'pnl', params], queryFn: async () => (await api.get('/financial-reports/profit-and-loss', { params })).data, ...options });

export const useBalanceSheet = (params = {}, options = {}) =>
  useQuery({ queryKey: [QUERY_KEY, 'balance-sheet', params], queryFn: async () => (await api.get('/financial-reports/balance-sheet', { params })).data, ...options });

export const useCashBook = (params = {}, options = {}) =>
  useQuery({ queryKey: [QUERY_KEY, 'cash-book', params], queryFn: async () => (await api.get('/financial-reports/cash-book', { params })).data, ...options });

export const useDayBook = (params = {}, options = {}) =>
  useQuery({ queryKey: [QUERY_KEY, 'day-book', params], queryFn: async () => (await api.get('/financial-reports/day-book', { params })).data, ...options });
