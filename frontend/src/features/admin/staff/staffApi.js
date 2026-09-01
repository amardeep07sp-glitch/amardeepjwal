import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { STAFF_ROLES } from '@/constants/roles';

const QUERY_KEY = 'staff';

// Reuses the existing /auth/users staff-directory endpoint (already
// paginated/searchable/role-filterable - see auth.routes.js) rather than a
// new list route, just always passing every non-customer role so this
// reads as "the whole staff roster", not one agent-picker's narrower slice.
export const useStaffList = ({ page = 1, limit = 20, search } = {}) =>
  useQuery({
    queryKey: [QUERY_KEY, { page, limit, search }],
    queryFn: async () =>
      (
        await api.get('/auth/users', {
          params: { page, limit, search: search || undefined, role: STAFF_ROLES.join(',') },
        })
      ).data,
    placeholderData: keepPreviousData,
  });

export const useCreateStaff = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => api.post('/auth/staff', payload).then((res) => res.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
};

// Role and/or isActive only - see auth.service.js#updateStaffUser's own
// comment on why this isn't a general profile editor.
export const useUpdateStaff = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => api.patch(`/auth/staff/${id}`, payload).then((res) => res.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
};
