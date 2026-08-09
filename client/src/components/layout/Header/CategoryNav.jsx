import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { NavLink } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, ChevronDown, Gem, LayoutGrid } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useNavbarCategories } from '@/features/categories/categoriesApi';
import { useProductFacets, useProductList } from '@/features/products/productsApi';
import { NAV_EXTRA_AFTER, NAV_EXTRA_BEFORE, categoryPath } from '@/config/navConfig';
import { formatPrice } from '@/lib/format';
import { cn } from '@/lib/utils';

// Real, round breakpoints intersected with the real min/max from
// /products/public/facets (product.repository.js#getPublicPriceRange) - the
// bands themselves are a UI convenience (same idea as Tanishq's own
// "₹25,000-₹50,000" filter chip), never fabricated bounds. A breakpoint
// outside the real [min,max] range is simply dropped.
const PRICE_BREAKPOINTS = [25000, 50000, 100000, 200000, 500000];

function buildPriceBands(priceRange) {
  if (!priceRange || !(priceRange.max > 0)) return [];
  const points = [...new Set([priceRange.min, ...PRICE_BREAKPOINTS.filter((p) => p > priceRange.min && p < priceRange.max), priceRange.max])].sort(
    (a, b) => a - b
  );
  if (points.length < 2) return [];

  return points.slice(0, -1).map((lo, i) => ({
    min: i === 0 ? undefined : lo,
    max: points[i + 1],
    label: i === 0 ? `Under ${formatPrice(points[i + 1])}` : `${formatPrice(lo)} - ${formatPrice(points[i + 1])}`,
  }));
}

// Every real category now gets a hover mega menu, not just the ones with
// subcategories - most of this catalog's categories are currently flat
// (no children configured in Admin -> Categories yet), and a bare link
// hovering over to nothing was the actual gap being fixed here. A category
// WITH children keeps the rich subcategory grid ('category'); a leaf
// category gets a live preview of its own real products instead
// ('category-preview', fetched on hover in CategoryMegaMenuPanel via the
// exact same /products/public?category= the category page itself uses) -
// never a fabricated subcategory list standing in for data that doesn't
// exist. Both share the same promo-panel + heading/CTA shape.
function buildNavItems(categories) {
  return categories.map((category) => {
    const shared = {
      name: category.name,
      description: category.shortDescription,
      bannerMedia: category.bannerMedia,
      ctaLabel: `View All ${category.name}`,
      ctaPath: categoryPath(category.slug),
    };

    return {
      label: category.name,
      path: categoryPath(category.slug),
      megaMenu: category.children?.length
        ? {
          ...shared,
          type: 'category',
          heading: `Shop ${category.name}`,
          links: category.children.map((c) => ({
            label: c.name,
            path: categoryPath(c.slug),
            thumbnailMedia: c.thumbnailMedia,
            productCount: c.productCountRecursive ?? c.productCount ?? 0,
          })),
        }
        : {
          ...shared,
          type: 'category-preview',
          heading: `${category.name} - Bestsellers`,
          categorySlug: category.slug,
          productCount: category.productCountRecursive ?? category.productCount ?? 0,
        },
    };
  });
}

// Small real product-thumbnail (or a gold gem glyph when the category has
// none set yet) next to each child link - mirrors Tanishq's icon-per-item
// mega menu without inventing fake imagery for categories that don't have a
// thumbnail configured.
function CategoryLinkThumb({ media }) {
  if (media?.thumbnailUrl || media?.secureUrl) {
    return (
      <img
        src={media.thumbnailUrl || media.secureUrl}
        alt=""
        className="size-8 shrink-0 rounded-full border border-[#EFE6D3] object-cover"
      />
    );
  }
  return (
    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#FFF9EF] text-[#C8A24D]">
      <Gem className="size-3.5" />
    </span>
  );
}

// The right-hand promo column of a category mega menu - a real banner photo
// (Admin -> Categories -> banner image) with a scrim + CTA, or a tasteful
// animated gold fallback when that field hasn't been set yet, so the menu
// never looks unfinished either way.
function CategoryPromoPanel({ megaMenu }) {
  return (
    <NavLink
      to={megaMenu.ctaPath}
      className="group relative block h-full min-h-52 overflow-hidden rounded-2xl bg-[#FBF4E4]"
    >
      {megaMenu.bannerMedia?.secureUrl ? (
        <img
          src={megaMenu.bannerMedia.secureUrl}
          alt={megaMenu.bannerMedia.altText || megaMenu.name}
          className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      ) : (
        <div className="absolute inset-0 bg-linear-to-br from-[#C8A24D]/25 via-[#FBF4E4] to-[#FBF4E4]" />
      )}
      <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/10 to-transparent" />

      <div className="relative flex h-full flex-col justify-end gap-1 p-5">
        <p className="font-nav text-lg font-medium text-white drop-shadow-sm">{megaMenu.name}</p>
        {megaMenu.description && (
          <p className="line-clamp-2 text-xs text-white/85">{megaMenu.description}</p>
        )}
        <span className="mt-2 inline-flex w-fit items-center gap-1.5 text-xs font-semibold tracking-wide text-white uppercase">
          Shop Now <ArrowRight className="size-3.5 transition-transform duration-300 group-hover:translate-x-1" />
        </span>
      </div>
    </NavLink>
  );
}

// A leaf category's hover content - its own real, live products (same
// /products/public?category= read the category page itself uses, just
// limit=4), not a placeholder. `enabled` keeps this from firing until the
// category is actually the one being hovered; react-query then caches it
// by slug, so re-hovering the same category after the first time is
// instant with no refetch.
function CategoryProductPreview({ categorySlug, ctaPath }) {
  const { data, isLoading } = useProductList({ category: categorySlug, limit: 4, sortBy: 'featured' });
  const products = data?.items ?? [];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="aspect-square animate-pulse rounded-xl bg-[#FFF9EF]" />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return <p className="text-sm text-[#8A8378]">No products in this category yet.</p>;
  }

  return (
    <ul className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {products.map((product) => (
        <li key={product.id}>
          <NavLink to={`/products/${product.slug}`} className="group/tile flex flex-col gap-2">
            <div className="aspect-square overflow-hidden rounded-xl bg-[#FFF9EF] ring-1 ring-[#EFE6D3]">
              {product.image ? (
                <img
                  src={product.image.secureUrl}
                  alt={product.image.altText || product.name}
                  className="size-full object-cover transition-transform duration-500 group-hover/tile:scale-105"
                />
              ) : (
                <div className="flex size-full items-center justify-center text-[#C8A24D]">
                  <Gem className="size-6" />
                </div>
              )}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-light text-[#4A463F] group-hover/tile:text-[#C8A24D]">{product.name}</p>
              <p className="text-xs font-semibold text-[#B88A2F]">{formatPrice(product.price.finalPrice)}</p>
            </div>
          </NavLink>
        </li>
      ))}
      {/* Ties the preview grid back to the category page it's a preview
          of - a 5th "tile" that behaves like the CTA link below it. */}
      {products.length >= 4 && (
        <li>
          <NavLink
            to={ctaPath}
            className="flex aspect-square flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-[#E4D4A8] text-[#B88A2F] transition-colors hover:bg-[#FFF9EF]"
          >
            <ArrowRight className="size-5" />
            <span className="text-xs font-semibold">View All</span>
          </NavLink>
        </li>
      )}
    </ul>
  );
}

const withQuery = (path, params) => {
  const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined && v !== ''));
  const query = qs.toString();
  return query ? `${path}?${query}` : path;
};

const FACET_TABS = [
  { key: 'category', label: 'Category' },
  { key: 'price', label: 'Price' },
  { key: 'occasion', label: 'Occasion' },
  { key: 'gender', label: 'Gender' },
];

// The tabbed left rail + value grid (Category / Price / Occasion / Gender)
// inside a category's mega menu - mirrors tanishq.co.in's hover panel.
// Category uses this category's own real children (see buildNavItems);
// Price/Occasion/Gender use the real, site-wide facet counts from
// /products/public/facets (product.service.js#getPublicFacets) - the exact
// same data source that already powers the All Products page's filter
// sidebar (ProductFilterSidebar.jsx), just surfaced here too. A tab only
// appears when it actually has real values to show. Every value link stays
// scoped to the category being hovered (categoryPath + the facet as a query
// param), so "Diamond > Wedding" really does filter to Diamond AND Wedding.
function CategoryMegaMenuPanel({ megaMenu }) {
  const [tab, setTab] = useState('category');
  const { data: facets } = useProductFacets();

  const priceBands = useMemo(() => buildPriceBands(facets?.priceRange), [facets?.priceRange]);
  const availableTabs = FACET_TABS.filter((t) => {
    if (t.key === 'category') return true;
    if (t.key === 'price') return priceBands.length > 0;
    if (t.key === 'occasion') return facets?.occasions?.length > 0;
    if (t.key === 'gender') return facets?.genders?.length > 0;
    return false;
  });

  return (
    <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-10 py-8 lg:grid-cols-[160px_1fr_300px]">
      <div className="flex gap-1 overflow-x-auto lg:flex-col lg:gap-0.5 lg:overflow-visible lg:border-r lg:border-[#EFE6D3] lg:pr-4">
        {availableTabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={cn(
              'font-nav shrink-0 rounded-lg px-3 py-2 text-left text-sm font-light whitespace-nowrap transition-all duration-200',
              tab === t.key ? 'bg-[#FBF4E4] text-[#B88A2F] font-medium' : 'text-[#4A463F] hover:bg-[#FFF9EF] hover:text-[#C8A24D]'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div>
        {tab === 'category' && megaMenu.type === 'category' && (
          <>
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-[#B88A2F]">{megaMenu.heading}</p>
            <ul className="grid grid-cols-2 gap-x-6 gap-y-1 sm:grid-cols-3">
              {megaMenu.links.map((link) => (
                <li key={link.path}>
                  <NavLink
                    to={link.path}
                    className="font-nav flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm font-light text-[#4A463F] transition-all duration-300 hover:bg-[#FFF9EF] hover:text-[#C8A24D]"
                  >
                    <CategoryLinkThumb media={link.thumbnailMedia} />
                    <span className="min-w-0 flex-1 truncate">{link.label}</span>
                    {link.productCount > 0 && <span className="shrink-0 text-xs text-[#8A8378]">{link.productCount}</span>}
                  </NavLink>
                </li>
              ))}
            </ul>
            <NavLink
              to={megaMenu.ctaPath}
              className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-[#B88A2F] transition-colors duration-300 hover:text-[#C8A24D]"
            >
              {megaMenu.ctaLabel} <ArrowRight className="size-3.5" />
            </NavLink>
          </>
        )}

        {/* Leaf category (no subcategories configured) - a live preview of
            its own real products instead of an empty/missing dropdown. */}
        {tab === 'category' && megaMenu.type === 'category-preview' && (
          <>
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-[#B88A2F]">{megaMenu.heading}</p>
            <CategoryProductPreview categorySlug={megaMenu.categorySlug} ctaPath={megaMenu.ctaPath} />
            <NavLink
              to={megaMenu.ctaPath}
              className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-[#B88A2F] transition-colors duration-300 hover:text-[#C8A24D]"
            >
              {megaMenu.ctaLabel} <ArrowRight className="size-3.5" />
            </NavLink>
          </>
        )}

        {tab === 'price' && (
          <>
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-[#B88A2F]">Shop by Price</p>
            <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {priceBands.map((band) => (
                <li key={band.label}>
                  <NavLink
                    to={withQuery(megaMenu.ctaPath, { minPrice: band.min, maxPrice: band.max })}
                    className="font-nav block rounded-lg px-3 py-2.5 text-sm font-light text-[#4A463F] ring-1 ring-[#EFE6D3] transition-all duration-300 hover:bg-[#FFF9EF] hover:text-[#C8A24D] hover:ring-[#C8A24D]/40"
                  >
                    {band.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </>
        )}

        {tab === 'occasion' && (
          <>
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-[#B88A2F]">Shop by Occasion</p>
            <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {(facets?.occasions ?? []).map((o) => (
                <li key={o.value}>
                  <NavLink
                    to={withQuery(megaMenu.ctaPath, { occasion: o.value })}
                    className="font-nav flex items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-sm font-light text-[#4A463F] ring-1 ring-[#EFE6D3] transition-all duration-300 hover:bg-[#FFF9EF] hover:text-[#C8A24D] hover:ring-[#C8A24D]/40"
                  >
                    {o.label} <span className="text-xs text-[#8A8378]">{o.count}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </>
        )}

        {tab === 'gender' && (
          <>
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-[#B88A2F]">Shop by Gender</p>
            <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {(facets?.genders ?? []).map((g) => (
                <li key={g.value}>
                  <NavLink
                    to={withQuery(megaMenu.ctaPath, { gender: g.value })}
                    className="font-nav flex items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-sm font-light text-[#4A463F] ring-1 ring-[#EFE6D3] transition-all duration-300 hover:bg-[#FFF9EF] hover:text-[#C8A24D] hover:ring-[#C8A24D]/40"
                  >
                    {g.label} <span className="text-xs text-[#8A8378]">{g.count}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      <CategoryPromoPanel megaMenu={megaMenu} />
    </div>
  );
}

// Desktop-only category strip + hover mega menus, live from
// /categories/public/navbar - never hardcoded. Mobile gets the same data
// rendered as an accordion inside MobileMenu instead. Never renders below
// `lg`. Degrades quietly (just the static New Arrivals/Offers links) while
// loading or if the category fetch fails - a broken nav must never break
// the whole header.
export function CategoryNav() {
  const { data: categories } = useNavbarCategories();
  const [openIndex, setOpenIndex] = useState(null);
  const [menuRect, setMenuRect] = useState(null);
  const closeTimer = useRef(null);
  const navRef = useRef(null);

  const navItems = useMemo(
    () => [...NAV_EXTRA_BEFORE, ...buildNavItems(categories ?? []), ...NAV_EXTRA_AFTER],
    [categories]
  );

  const openMenu = (index) => {
    clearTimeout(closeTimer.current);
    setOpenIndex(index);
  };
  const scheduleClose = () => {
    closeTimer.current = setTimeout(() => setOpenIndex(null), 150);
  };

  const activeItem = openIndex !== null ? navItems[openIndex] : null;

  // The mega menu panel is portaled to <body> (below) so it can't ever be
  // clipped by an ancestor's `overflow-hidden` - the one thing that would
  // otherwise conflict with Header.jsx wrapping this bar in a collapsing
  // container for the scroll-aware hide/show. Its position is computed here,
  // independent of wherever it's actually rendered in the DOM.
  useEffect(() => {
    if (!activeItem || !navRef.current) {
      setMenuRect(null);
      return undefined;
    }

    const updateRect = () => {
      const rect = navRef.current.getBoundingClientRect();
      setMenuRect({ top: rect.bottom, left: rect.left, width: rect.width });
    };
    updateRect();

    window.addEventListener('resize', updateRect);
    return () => window.removeEventListener('resize', updateRect);
  }, [activeItem]);

  return (
    <nav
      ref={navRef}
      className="relative hidden border-b border-[#E9DFC8] bg-white/95 backdrop-blur-md lg:block"
      onMouseLeave={scheduleClose}
    >
      <div className="mx-auto flex max-w-7xl items-stretch px-6 lg:px-8">
        {/* Shop By Category - pinned left, never part of the scrolling
            strip below, so it stays reachable no matter how many
            categories exist. */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className=" cursor-pointer font-nav flex shrink-0 items-center gap-2 border-r border-[#EFE6D3] px-5 py-4 text-sm font-light tracking-wide whitespace-nowrap text-[#3F3A33] transition-all duration-300 hover:bg-[#FFF9EF] hover:text-[#C8A24D]"
            >
              <LayoutGrid className="size-4" />
              Shop by Category
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="start"
            className="w-64 rounded-xl border border-[#EFE6D3] bg-white p-2 shadow-[0_15px_45px_rgba(0,0,0,0.08)]"
          >
            {(categories ?? []).map((cat) => (
              <DropdownMenuItem
                key={cat.id}
                asChild
                className="rounded-lg transition-colors focus:bg-[#FFF9EF]"
              >
                <NavLink
                  to={categoryPath(cat.slug)}
                  className="font-nav w-full rounded-lg px-3 py-2 text-sm font-light text-[#3F3A33] transition-all duration-300 hover:text-[#C8A24D]"
                >
                  {cat.name}
                </NavLink>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Main Navigation - a wide category list (many nav items at once)
            used to overflow max-w-7xl and silently break the header's
            layout at 1024-1280px. Scrolls horizontally instead now, with a
            fading right edge as a "there's more" affordance, rather than
            wrapping or forcing the page wider than the viewport. */}
        <div className="relative min-w-0 flex-1">
          <ul className="scrollbar-none flex items-stretch overflow-x-auto">
            {navItems.map((item, index) => (
              <li
                key={item.path}
                className="relative"
                onMouseEnter={() => item.megaMenu && openMenu(index)}
              >
                <NavLink
                  to={item.path}
                  onFocus={() => item.megaMenu && openMenu(index)}
                  className={({ isActive }) =>
                    cn(
                      "font-nav relative flex h-full items-center gap-1.5 px-5 py-4 text-sm font-light whitespace-nowrap text-[#3F3A33] transition-all duration-300 hover:bg-[#FFF9EF] hover:text-[#C8A24D]",

                      isActive &&
                      "text-[#B88A2F] after:absolute after:bottom-0 after:left-4 after:right-4 after:h-0.5 after:rounded-full after:bg-[#C8A24D]",

                      item.highlight && "text-[#B88A2F]"
                    )
                  }
                >
                  {item.icon && <item.icon className="size-3.5 text-[#B88A2F]/70" />}
                  {item.label}

                  {item.megaMenu && (
                    <ChevronDown
                      className={cn(
                        "size-3.5 transition-all duration-300",
                        openIndex === index
                          ? "rotate-180 text-[#C8A24D]"
                          : "text-[#8A8378]"
                      )}
                    />
                  )}

                  {item.badge && (
                    <Badge className="ml-1 h-5 rounded-full bg-[#C8A24D] px-2 text-[9px] font-semibold text-white shadow-sm">
                      {item.badge}
                    </Badge>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>

          {/* Fade hint - purely decorative, pointer-events-none so it never
              blocks clicks/hover on the last real item underneath it. */}
          <div className="pointer-events-none absolute top-0 right-0 h-full w-10 bg-linear-to-l from-white/95 to-transparent" />
        </div>
      </div>

      {/* Mega Menu - portaled to <body>, see the effect above and the
          comment on `menuRect`. Never rendered as a descendant of this
          <nav> so no ancestor's `overflow-hidden` (Header.jsx's scroll-hide
          collapse wrapper) can ever clip it. */}
      {createPortal(
        <AnimatePresence>
          {activeItem?.megaMenu && menuRect && (
            <motion.div
              key={activeItem.label}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              onMouseEnter={() => openMenu(openIndex)}
              onMouseLeave={scheduleClose}
              style={{ position: 'fixed', top: menuRect.top, left: menuRect.left, width: menuRect.width }}
              className="z-40 border-t border-[#EFE6D3] bg-white shadow-[0_20px_60px_rgba(0,0,0,0.08)]"
            >
              {activeItem.megaMenu.type === 'category' || activeItem.megaMenu.type === 'category-preview' ? (
                <CategoryMegaMenuPanel key={activeItem.label} megaMenu={activeItem.megaMenu} />
              ) : (
                <div className="mx-auto grid max-w-7xl grid-cols-2 gap-10 px-10 py-8 sm:grid-cols-3">
                  {activeItem.megaMenu.columns.map((col) => (
                    <div key={col.heading}>
                      <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-[#B88A2F]">
                        {col.heading}
                      </p>

                      <ul className="space-y-1">
                        {col.links.map((link) => (
                          <li key={link.path}>
                            <NavLink
                              to={link.path}
                              className="font-nav block rounded-lg px-3 py-2 text-sm font-light text-[#4A463F] transition-all duration-300 hover:bg-[#FFF9EF] hover:text-[#C8A24D]"
                            >
                              {link.label}
                            </NavLink>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </nav>
  );
}
