import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

const QUERY_KEY = 'financial-dashboard';

export const useFinancialDashboardTotals = (options = {}) =>
  useQuery({ queryKey: [QUERY_KEY, 'totals'], queryFn: async () => (await api.get('/financial-dashboard/totals')).data, ...options });

export const useIncomeVsExpenseTrend = (months = 6, options = {}) =>
  useQuery({
    queryKey: [QUERY_KEY, 'income-vs-expense', months],
    queryFn: async () => (await api.get('/financial-dashboard/income-vs-expense', { params: { months } })).data,
    ...options,
  });

export const useCashFlowTrend = (days = 14, options = {}) =>
  useQuery({
    queryKey: [QUERY_KEY, 'cash-flow', days],
    queryFn: async () => (await api.get('/financial-dashboard/cash-flow', { params: { days } })).data,
    ...options,
  });
