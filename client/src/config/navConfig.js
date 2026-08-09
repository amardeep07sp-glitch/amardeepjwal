import { Award, Grid2x2, Layers, Percent, Sparkles } from 'lucide-react';

// Only the couple of nav entries that AREN'T product categories live here
// now - New Arrivals and Offers are storefront concepts, not rows in the
// Category collection, so there's no API to fetch them from. Every actual
// category (the header's mega menus, "Shop by Category", the homepage
// section) comes live from /categories/public/* - see features/categories/
// categoriesApi.js. Nothing in this file is catalog data.
export const NAV_EXTRA_BEFORE = [
  { label: 'All Products', path: '/products', icon: Grid2x2 },
  { label: 'New Arrivals', path: '/new-arrivals', badge: 'NEW', icon: Sparkles },
  { label: 'Collections', path: '/collections', icon: Layers },
  { label: 'Brands', path: '/brands', icon: Award },
];

// "More" reuses the exact same megaMenu shape a category-with-children
// gets (see buildNavItems in CategoryNav.jsx/MobileMenu.jsx) so it gets
// the hover dropdown (desktop) and accordion (mobile) for free - no
// special-cased trigger component needed. The linked pages don't exist
// yet; that's deliberate, this pass only wires up the nav shell.
export const NAV_EXTRA_AFTER = [
  { label: 'Offers', path: '/offers', badge: 'HOT', highlight: true, icon: Percent },
  {
    label: 'More',
    path: '/more',
    megaMenu: {
      columns: [
        {
          heading: 'Company',
          links: [
            { label: 'About Us', path: '/about' },
            { label: 'Blog', path: '/blog' },
            { label: 'Store Locator', path: '/stores' },
          ],
        },
        {
          heading: 'Support',
          links: [
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
