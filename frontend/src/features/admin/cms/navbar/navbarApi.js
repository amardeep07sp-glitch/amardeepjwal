import { createResourceHooks } from '@/lib/createResourceHooks';

export const {
  useList: useNavbarItems,
  useCreateItem: useCreateNavbarItem,
  useUpdateItem: useUpdateNavbarItem,
  useDeleteItem: useDeleteNavbarItem,
} = createResourceHooks({ basePath: '/navbar', queryKey: 'navbar-items' });
