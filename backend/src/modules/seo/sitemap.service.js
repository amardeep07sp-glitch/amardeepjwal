import { Product } from '../product/product.model.js';
import { Category } from '../category/category.model.js';
import { Brand } from '../brand/brand.model.js';
import { Page } from '../page/page.model.js';
import { CATALOG_STATUSES } from '../../constants/catalog.js';
import { PAGE_STATUSES } from '../../constants/cms.js';

const escapeXml = (value) =>
  String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[char]));

const urlEntry = ({ loc, lastmod, changefreq, priority }) => {
  const parts = [`    <loc>${escapeXml(loc)}</loc>`];
  if (lastmod) parts.push(`    <lastmod>${new Date(lastmod).toISOString()}</lastmod>`);
  if (changefreq) parts.push(`    <changefreq>${changefreq}</changefreq>`);
  if (priority != null) parts.push(`    <priority>${priority}</priority>`);
  return `  <url>\n${parts.join('\n')}\n  </url>`;
};

// A fixed set of real, always-crawlable storefront routes that aren't
// backed by a single DB document (App.jsx's own top-level routes) - kept
// here rather than hardcoded in the route handler so the one file that
// knows "what does the sitemap contain" stays the single place to update
// when a new top-level page is added.
const STATIC_ROUTES = [
  { path: '/', changefreq: 'daily', priority: '1.0' },
  { path: '/products', changefreq: 'daily', priority: '0.9' },
  { path: '/new-arrivals', changefreq: 'daily', priority: '0.8' },
  { path: '/offers', changefreq: 'daily', priority: '0.8' },
  { path: '/categories', changefreq: 'weekly', priority: '0.7' },
  { path: '/collections', changefreq: 'weekly', priority: '0.7' },
  { path: '/brands', changefreq: 'weekly', priority: '0.6' },
  { path: '/faqs', changefreq: 'monthly', priority: '0.4' },
  { path: '/contact', changefreq: 'monthly', priority: '0.4' },
  { path: '/gold-rate', changefreq: 'daily', priority: '0.5' },
  { path: '/help', changefreq: 'weekly', priority: '0.4' },
];

// The one real sitemap the storefront domain serves (see seo.routes.js,
// mounted at the app root, not under /api/v1) - every entry is a real,
// currently-live, publicly-crawlable URL: published+visible products,
// categories, brands, and CMS pages, plus the fixed static routes above.
// Nothing draft/hidden/archived, nothing account-scoped, ever appears here.
export async function buildSitemapXml(siteUrl) {
  const [products, categories, brands, pages] = await Promise.all([
    Product.find({ status: CATALOG_STATUSES.PUBLISHED, isVisible: true }).select('slug updatedAt').lean(),
    Category.find({ status: CATALOG_STATUSES.PUBLISHED, isVisible: true }).select('slug updatedAt').lean(),
    Brand.find({ status: CATALOG_STATUSES.PUBLISHED, isVisible: true }).select('slug updatedAt').lean(),
    Page.find({ status: PAGE_STATUSES.PUBLISHED }).select('slug updatedAt').lean(),
  ]);

  const entries = [
    ...STATIC_ROUTES.map((r) => urlEntry({ loc: `${siteUrl}${r.path}`, changefreq: r.changefreq, priority: r.priority })),
    ...products.map((p) => urlEntry({ loc: `${siteUrl}/products/${p.slug}`, lastmod: p.updatedAt, changefreq: 'weekly', priority: '0.8' })),
    ...categories.map((c) => urlEntry({ loc: `${siteUrl}/category/${c.slug}`, lastmod: c.updatedAt, changefreq: 'weekly', priority: '0.7' })),
    ...brands.map((b) => urlEntry({ loc: `${siteUrl}/brand/${b.slug}`, lastmod: b.updatedAt, changefreq: 'weekly', priority: '0.6' })),
    ...pages.map((pg) => urlEntry({ loc: `${siteUrl}/pages/${pg.slug}`, lastmod: pg.updatedAt, changefreq: 'monthly', priority: '0.3' })),
  ];

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join('\n')}\n</urlset>`;
}

// Every account-scoped/private/transactional route (App.jsx) - a crawler
// has nothing to gain from indexing these (they either require a session
// or are single-use, one-per-order URLs), and letting search engines
// pointlessly crawl them wastes crawl budget the real catalog pages need.
// `/search` is disallowed for the standard "don't let engines index your
// own on-site search results" reason (thin/duplicate content vs. the
// underlying category pages it's just filtering).
const DISALLOWED_PATHS = [
  '/cart',
  '/checkout',
  '/order-confirmation',
  '/orders',
  '/wishlist',
  '/profile',
  '/rewards',
  '/addresses',
  '/support',
  '/login',
  '/forgot-password',
  '/reset-password',
  '/search',
];

export function buildRobotsTxt(siteUrl) {
  const disallowLines = DISALLOWED_PATHS.map((path) => `Disallow: ${path}`).join('\n');
  return `User-agent: *\nAllow: /\n${disallowLines}\n\nSitemap: ${siteUrl}/sitemap.xml\n`;
}
