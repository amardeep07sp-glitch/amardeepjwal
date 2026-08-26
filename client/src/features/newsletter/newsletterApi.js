import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';

export const useSubscribeNewsletter = () =>
  useMutation({
    mutationFn: (email) => api.post('/newsletter/subscribe', { email }).then((res) => res.data),
  });
