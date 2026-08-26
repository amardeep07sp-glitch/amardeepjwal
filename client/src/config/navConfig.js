import { Award, Grid2x2, Layers, Percent, Sparkles } from 'lucide-react';

// Only the couple of nav entries that AREN'T product categories live here
// now - New Arrivals and Offers are storefront concepts, not rows in the
// Category collection, so there's no API to fetch them from. Every actual
// category (the header's mega menus, "Shop by Category", the homepage
// section) comes live from /categories/public/* - see features/categories/
// categoriesApi.js. Nothing in this file is catalog data.
export const NAV_EXTRA_BEFORE = [
  { label: 'All Products', path: '/products', icon: Grid2x2 },
  { label: 'Mudrika', path: '/mudrika', badge: 'OUR BRAND', highlight: true, icon: Sparkles },
  { label: 'New Arrivals', path: '/new-arrivals', badge: 'NEW', icon: Sparkles },
  { label: 'Collections', path: '/collections', icon: Layers },
  { label: 'Brands', path: '/brands', icon: Award },
];

// "More" reuses the exact same megaMenu shape a category-with-children
// gets (see buildNavItems in CategoryNav.jsx/MobileMenu.jsx) so it gets
// the hover dropdown (desktop) and accordion (mobile) for free - no
// special-cased trigger component needed. Every link here has a real page
// behind it - "About Us"/"Blog"/"Store Locator" were deliberately dropped
// rather than shipped as dead links or filled with invented company copy/
// store addresses this project has no real data for.
export const NAV_EXTRA_AFTER = [
  { label: 'Offers', path: '/offers', badge: 'HOT', highlight: true, icon: Percent },
  {
    label: 'More',
    path: '/more',
    megaMenu: {
      columns: [
        {
          heading: 'Support',
          links: [
            { label: 'Help Center', path: '/help' },
            { label: 'Track Order', path: '/track-order' },
            { label: "Today's Gold Rate", path: '/gold-rate' },
            { label: 'Contact Us', path: '/contact' },
            { label: 'FAQs', path: '/faqs' },
          ],
        },
      ],
    },
  },
];

// Canonical category URL, matching the backend's own scheme
// (category.serializer.js: `${env.SITE_URL}/category/${slug}`).
export const categoryPath = (slug) => `/category/${slug}`;

export const brandPath = (slug) => `/brand/${slug}`;

// Header "browse chrome" policy - shared by BOTH the mobile search row
// (MainHeader.jsx) and the desktop category nav strip/mega menus
// (CategoryNav.jsx, hidden lg:block). A discovery page (Home/Products/
// Category/Collections/Brands/Search/PDP) genuinely needs "search for
// something else" and "jump to another category" one tap/click away; a
// task page (Cart/Checkout/Orders/Account/Help/Support/...) doesn't -
// showing them there is dead weight at best (mobile: ~110-140px of
// permanent vertical space) and an active distraction at worst (desktop:
// a full category mega-menu strip competing with "finish checking out").
// Same "don't show shopping chrome where it doesn't belong" judgment
// AuthLayout.jsx already applies to the auth screen, just scoped to
// pieces of MainLayout's header instead of the whole thing. Listed as an
// allowlist (browse pages) rather than a blocklist so any NEW route
// added later defaults to the focused, distraction-free chrome unless
// deliberately opted in here.
const BROWSE_EXACT_PATHS = new Set(['/', '/products', '/new-arrivals', '/offers', '/categories', '/collections', '/brands', '/search', '/mudrika']);
const BROWSE_PREFIXES = ['/products/', '/category/', '/collections/', '/brand/', '/mudrika'];

export function isBrowsePath(pathname) {
  if (BROWSE_EXACT_PATHS.has(pathname)) return true;
  return BROWSE_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}
