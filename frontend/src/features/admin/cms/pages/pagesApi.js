import { createResourceHooks } from '@/lib/createResourceHooks';

export const {
  useList: usePages,
  useCreateItem: useCreatePage,
  useUpdateItem: useUpdatePage,
  useDeleteItem: useDeletePage,
} = createResourceHooks({ basePath: '/pages', queryKey: 'pages' });
