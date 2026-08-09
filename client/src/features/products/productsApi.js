import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

// Every hook here hits a public, unauthenticated /products/public/* route
// (backend/src/modules/product) - published + visible products only, with
// cost price stripped server-side (the rest of the jewellery pricing
// breakdown is real and shown - see product.serializer.js).

// The general-purpose paginated read - powers the All Products page, the
// New Arrivals full page, a category page, and the Offers page, all
// through one query shape. `categories`/`tags` are plain arrays - the
// fetch client joins them into the comma-separated string the backend's
// zod schema expects. `keepPreviousData` avoids a skeleton flash on every
// page-change/filter-change click.
export const useProductList = ({
  page = 1,
  limit = 12,
  category,
  categories,
  brand,
  brands,
  tags,
  minPrice,
  maxPrice,
  sortBy = 'featured',
  onSale,
  gender,
  occasion,
  search,
} = {}) =>
  useQuery({
    queryKey: [
      'storefront',
      'products',
      'list',
      { page, limit, category, categories, brand, brands, tags, minPrice, maxPrice, sortBy, onSale, gender, occasion, search },
    ],
    queryFn: async () =>
      (
        await api.get('/products/public', {
          params: { page, limit, category, categories, brand, brands, tags, minPrice, maxPrice, sortBy, onSale, gender, occasion, search },
        })
      ).data,
    placeholderData: keepPreviousData,
  });

export const useNewArrivals = (limit = 8) =>
  useQuery({
    queryKey: ['storefront', 'products', 'new-arrivals', limit],
    queryFn: async () => (await api.get('/products/public/new-arrivals', { params: { limit } })).data,
    staleTime: 5 * 60 * 1000,
  });

export const useFeaturedProducts = (limit = 8) =>
  useQuery({
    queryKey: ['storefront', 'products', 'featured', limit],
    queryFn: async () => (await api.get('/products/public/featured', { params: { limit } })).data,
    staleTime: 5 * 60 * 1000,
  });

// Real "what's actually selling right now" (last 30 days of orders), backed
// off to isFeatured products when a store has too few recent sales to fill
// the row (see product.service.js#getPublicTrending) - never a fabricated
// list, so a brand-new store with zero orders still shows a real,
// admin-curated set instead of an empty section.
export const useTrendingProducts = (limit = 6) =>
  useQuery({
    queryKey: ['storefront', 'products', 'trending', limit],
    queryFn: async () => (await api.get('/products/public/trending', { params: { limit } })).data,
    staleTime: 5 * 60 * 1000,
  });

export const useProductBySlug = (slug) =>
  useQuery({
    queryKey: ['storefront', 'products', slug],
    queryFn: async () => (await api.get(`/products/public/${slug}`)).data,
    enabled: Boolean(slug),
  });

// Real category counts / price bounds / tags for the All Products page's
// filter sidebar - see product.service.js#getPublicFacets. Rarely changes
// within a session, so a long staleTime avoids refetching on every filter
// tweak.
export const useProductFacets = () =>
  useQuery({
    queryKey: ['storefront', 'products', 'facets'],
    queryFn: async () => (await api.get('/products/public/facets')).data,
    staleTime: 5 * 60 * 1000,
  });

// The header search bar's live-typing dropdown - real product + category
// name matches (product.service.js#searchSuggestions), not a client-side
// filter over already-fetched data. `enabled` keeps this from firing on an
// empty/whitespace query; the component debounces on top of that so it
// isn't refetching on every keystroke either.
export const useSearchSuggestions = (query, limit = 6) => {
  const q = query?.trim();
  return useQuery({
    queryKey: ['storefront', 'products', 'search-suggestions', q, limit],
    queryFn: async () => (await api.get('/products/public/search-suggestions', { params: { q, limit } })).data,
    enabled: Boolean(q),
    staleTime: 60 * 1000,
  });
};

export const useSimilarProducts = (slug, limit = 8) =>
  useQuery({
    queryKey: ['storefront', 'products', slug, 'similar', limit],
    queryFn: async () => (await api.get(`/products/public/${slug}/similar`, { params: { limit } })).data,
    enabled: Boolean(slug),
    staleTime: 5 * 60 * 1000,
  });
