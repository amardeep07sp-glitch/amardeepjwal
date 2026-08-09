import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

// Shared CRUD hook factory for simple admin resources (navbar items, banners,
// pages, footer columns, homepage sections, categories, ...). Each of these
// follows the exact same list/create/update/delete shape, so this avoids
// re-writing the same TanStack Query boilerplate per module.
//
// `params` (page, limit, status, search, sortBy, ...) are optional - resources
// without server-side pagination (like navbar items) simply omit them and get
// back the full list, same as before.
export function createResourceHooks({ basePath, queryKey }) {
  const useList = (params = {}, options = {}) =>
    useQuery({
      queryKey: [queryKey, params],
      queryFn: async () => (await api.get(basePath, { params })).data,
      placeholderData: keepPreviousData,
      ...options,
    });

  const useCreateItem = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (payload) => api.post(basePath, payload),
      onSuccess: () => queryClient.invalidateQueries({ queryKey: [queryKey] }),
    });
  };

  const useUpdateItem = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: ({ id, payload }) => api.patch(`${basePath}/${id}`, payload),
      onSuccess: () => queryClient.invalidateQueries({ queryKey: [queryKey] }),
    });
  };

  const useDeleteItem = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (id) => api.delete(`${basePath}/${id}`),
      onSuccess: () => queryClient.invalidateQueries({ queryKey: [queryKey] }),
    });
  };

  return { useList, useCreateItem, useUpdateItem, useDeleteItem };
}
