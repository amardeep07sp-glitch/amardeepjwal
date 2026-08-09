import { createResourceHooks } from '@/lib/createResourceHooks';

export const {
  useList: useBanners,
  useCreateItem: useCreateBanner,
  useUpdateItem: useUpdateBanner,
  useDeleteItem: useDeleteBanner,
} = createResourceHooks({ basePath: '/banners', queryKey: 'banners' });
