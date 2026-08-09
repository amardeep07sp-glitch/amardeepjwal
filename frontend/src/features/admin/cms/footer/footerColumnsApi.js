import { createResourceHooks } from '@/lib/createResourceHooks';

export const {
  useList: useFooterColumns,
  useCreateItem: useCreateFooterColumn,
  useUpdateItem: useUpdateFooterColumn,
  useDeleteItem: useDeleteFooterColumn,
} = createResourceHooks({ basePath: '/footer-columns', queryKey: 'footer-columns' });
