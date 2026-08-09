import { keepPreviousData, useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

// Every hook here hits a public, unauthenticated /collections/public/*
// route (backend/src/modules/collection) - published + public-visibility +
// in-schedule collections only (members/vip/hidden fail closed server-side).

export const useCollectionList = ({ page = 1, limit = 20, type } = {}) =>
  useQuery({
    queryKey: ['storefront', 'collections', 'list', { page, limit, type }],
    queryFn: async () => (await api.get('/collections/public', { params: { page, limit, type } })).data,
    placeholderData: keepPreviousData,
  });

export const useCollectionBySlug = (slug) =>
  useQuery({
    queryKey: ['storefront', 'collections', slug],
    queryFn: async () => (await api.get(`/collections/public/${slug}`)).data,
    enabled: Boolean(slug),
    staleTime: 10 * 60 * 1000,
  });

// The one infinite-scroll data source in this app - a collection's product
// grid is the only place the spec asks for it (the rest of the storefront
// uses numbered Pagination). `randomSeed` is generated once per mount by the
// caller and threaded through every page request so a "random" sortMode
// collection's shuffle stays stable across pages instead of re-sampling on
// every fetchNextPage call.
export const useCollectionProductsInfinite = (slug, { limit = 12, randomSeed, sortBy, minPrice, maxPrice } = {}) =>
  useInfiniteQuery({
    queryKey: ['storefront', 'collections', slug, 'products', { limit, randomSeed, sortBy, minPrice, maxPrice }],
    queryFn: async ({ pageParam = 1 }) =>
      (
        await api.get(`/collections/public/${slug}/products`, {
          params: { page: pageParam, limit, randomSeed, sortBy, minPrice, maxPrice },
        })
      ).data,
    getNextPageParam: (lastPage) => (lastPage.meta.page < lastPage.meta.totalPages ? lastPage.meta.page + 1 : undefined),
    enabled: Boolean(slug),
    initialPageParam: 1,
  });
