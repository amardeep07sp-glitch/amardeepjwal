import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

const QUERY_KEY = 'expense-categories';

const invalidate = (queryClient) => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });

export const useExpenseCategories = (options = {}) =>
  useQuery({
    queryKey: [QUERY_KEY],
    queryFn: async () => (await api.get('/expense-categories')).data,
    ...options,
  });

export const useCreateExpenseCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => api.post('/expense-categories', payload),
    onSuccess: () => invalidate(queryClient),
  });
};

export const useUpdateExpenseCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }) => api.put(`/expense-categories/${id}`, payload),
    onSuccess: () => invalidate(queryClient),
  });
};

export const useDeleteExpenseCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/expense-categories/${id}`),
    onSuccess: () => invalidate(queryClient),
  });
};
