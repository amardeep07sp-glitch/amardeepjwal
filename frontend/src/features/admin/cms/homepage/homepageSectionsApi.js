import { createResourceHooks } from '@/lib/createResourceHooks';

export const {
  useList: useHomepageSections,
  useCreateItem: useCreateHomepageSection,
  useUpdateItem: useUpdateHomepageSection,
  useDeleteItem: useDeleteHomepageSection,
} = createResourceHooks({ basePath: '/homepage-sections', queryKey: 'homepage-sections' });
