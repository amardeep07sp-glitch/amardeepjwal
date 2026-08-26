import { Award, Grid2x2, Layers, Percent, Sparkles } from 'lucide-react';

// Default categories fallback for graceful rendering before backend categories load
export const DEFAULT_CATEGORIES_FALLBACK = [
  { name: 'Gold Jewellery', slug: 'gold-jewellery' },
  { name: 'Diamond', slug: 'diamond' },
  { name: 'Rings', slug: 'rings' },
  { name: 'Earrings', slug: 'earrings' },
  { name: 'Necklaces', slug: 'necklaces' },
  { name: 'Bangles & Bracelets', slug: 'bangles-bracelets' },
  { name: 'Mangalsutra', slug: 'mangalsutra' },
  { name: 'Gold Coins', slug: 'gold-coins' },
];

export const NAV_STATIC_BEFORE = [
  { label: 'All Products', path: '/products', icon: Grid2x2 },
];

export const NAV_FEATURED_BRAND = {
  label: 'Mudrika',
  path: '/mudrika',
  badge: 'BRAND',
  highlight: true,
  icon: Sparkles,
};

export const NAV_STATIC_AFTER = [
  { label: 'New Arrivals', path: '/new-arrivals', badge: 'NEW', icon: Sparkles },
  { label: 'Collections', path: '/collections', icon: Layers },
  { label: 'Offers', path: '/offers', badge: 'HOT', highlight: true, icon: Percent },
  {
    label: 'More',
    path: '/more',
    megaMenu: {
      type: 'support',
      columns: [
        {
          heading: 'Customer Services',
          links: [
            { label: "Today's Gold Rate", path: '/gold-rate' },
            { label: 'Track Order', path: '/track-order' },
            { label: 'Help Center', path: '/help' },
            { label: 'Contact Us', path: '/contact' },
            { label: 'Frequently Asked Questions', path: '/faqs' },
          ],
        },
      ],
    },
  },
];

// Backwards compatibility aliases
export const NAV_EXTRA_BEFORE = [
  { label: 'All Products', path: '/products', icon: Grid2x2 },
  NAV_FEATURED_BRAND,
];

export const NAV_EXTRA_AFTER = NAV_STATIC_AFTER;

// Canonical category URL, matching the backend scheme
export const categoryPath = (slug) => `/category/${slug}`;

export const brandPath = (slug) => `/brand/${slug}`;

const BROWSE_EXACT_PATHS = new Set([
  '/',
  '/products',
  '/new-arrivals',
  '/offers',
  '/categories',
  '/collections',
  '/brands',
  '/search',
  '/mudrika',
]);
const BROWSE_PREFIXES = ['/products/', '/category/', '/collections/', '/brand/', '/mudrika'];

export function isBrowsePath(pathname) {
  if (BROWSE_EXACT_PATHS.has(pathname)) return true;
  return BROWSE_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}
