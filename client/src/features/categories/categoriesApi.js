import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

// Both hit public, unauthenticated /categories/public/* routes
// (backend/src/modules/category) - published + visible categories only.

// Nested tree of categories flagged showInNavbar - powers the header's
// "Shop by Category" dropdown and the desktop mega menus. A long staleTime
// is fine: nav structure changes rarely, and every page load re-validates
// it in the background anyway.
export const useNavbarCategories = () =>
  useQuery({
    queryKey: ['storefront', 'categories', 'navbar'],
    queryFn: async () => (await api.get('/categories/public/navbar')).data,
    staleTime: 10 * 60 * 1000,
  });

// Flat list of categories flagged showOnHomepage - powers the homepage's
// "Shop by Category" section.
export const useHomepageCategories = (limit = 8) =>
  useQuery({
    queryKey: ['storefront', 'categories', 'homepage', limit],
    queryFn: async () => (await api.get('/categories/public/homepage', { params: { limit } })).data,
    staleTime: 10 * 60 * 1000,
  });

// A single category by slug - used to resolve a category page's heading
// (the product list itself is fetched separately, filtered by the same
// slug - see useProductList).
export const useCategoryBySlug = (slug) =>
  useQuery({
    queryKey: ['storefront', 'categories', slug],
    queryFn: async () => (await api.get(`/categories/public/${slug}`)).data,
    enabled: Boolean(slug),
    staleTime: 10 * 60 * 1000,
  });

// The "All Categories" page.
export const useCategoryList = ({ page = 1, limit = 20 } = {}) =>
  useQuery({
    queryKey: ['storefront', 'categories', 'list', { page, limit }],
    queryFn: async () => (await api.get('/categories/public', { params: { page, limit } })).data,
    placeholderData: keepPreviousData,
  });
