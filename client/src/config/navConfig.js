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

// Allowlist, not a blocklist - the full marketing Footer (trust-badge
// ribbon, newsletter banner, 4-column link directory, payment badges) used
// to render under literally every route (MainLayout rendered it
// unconditionally). That's real content on the homepage, and still earns
// its place at the bottom of a Product Detail page (the one place a
// shopper who scrolls past "Add to Cart" is genuinely still evaluating the
// purchase - trust badges/policies/newsletter belong right there). Every
// other page - listings, category/brand/collection pages, cart, checkout,
// every account page - repeated the entire footer for no real reason, so
// this is deliberately narrow: two page families, not a hide-list of
// everything that seemed obviously wrong.
const FOOTER_VISIBLE_EXACT_PATHS = new Set(['/']);
const FOOTER_VISIBLE_PREFIXES = ['/products/'];

export function isFooterVisiblePath(pathname) {
  if (FOOTER_VISIBLE_EXACT_PATHS.has(pathname)) return true;
  return FOOTER_VISIBLE_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

// The global site header (hamburger menu, search, deliver-to, wishlist,
// cart) used to render on every single page, checkout included - real
// checkout-abandonment-reduction UX (and every major e-commerce site) hides
// exactly these "leave the funnel" temptations once a shopper has committed
// to paying. CheckoutPage already renders its own back-button + "Checkout"
// title + step indicator, so hiding the global header here isn't leaving
// the page headerless, it's removing a second, redundant one sitting above it.
const HEADER_HIDDEN_EXACT_PATHS = new Set(['/checkout']);

export function isHeaderHiddenPath(pathname) {
  return HEADER_HIDDEN_EXACT_PATHS.has(pathname);
}
