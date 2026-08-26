import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { NavLink } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, ChevronDown, ChevronRight, Grid2x2, LayoutGrid, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useNavbarCategories } from '@/features/categories/categoriesApi';
import { usePublicNavbarItems } from '@/features/navbar/navbarApi';
import { useProductFacets, useProductList } from '@/features/products/productsApi';
import { SmartLink } from '@/components/global/SmartLink';
import {
  DEFAULT_CATEGORIES_FALLBACK,
  NAV_FEATURED_BRAND,
  NAV_STATIC_AFTER,
  categoryPath,
} from '@/config/navConfig';
import { formatPrice } from '@/lib/format';
import { cn } from '@/lib/utils';

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

function buildNavCategoryItems(categories) {
  const cats = categories && categories.length > 0 ? categories : DEFAULT_CATEGORIES_FALLBACK;

  return cats.map((category) => {
    const slug = category.slug || category.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const shared = {
      name: category.name,
      description: category.shortDescription || `Explore our exclusive ${category.name} collection handcrafted in pure gold & diamonds.`,
      bannerMedia: category.bannerMedia,
      ctaLabel: `View All ${category.name}`,
      ctaPath: categoryPath(slug),
    };

    return {
      label: category.name,
      path: categoryPath(slug),
      megaMenu: category.children?.length
        ? {
            ...shared,
            type: 'category',
            heading: `Shop ${category.name}`,
            links: category.children.map((c) => ({
              label: c.name,
              path: categoryPath(c.slug || c.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')),
              thumbnailMedia: c.thumbnailMedia,
              productCount: c.productCountRecursive ?? c.productCount ?? 0,
            })),
          }
        : {
            ...shared,
            type: 'category-preview',
            heading: `${category.name} - Bestsellers`,
            categorySlug: slug,
            productCount: category.productCountRecursive ?? category.productCount ?? 0,
          },
    };
  });
}

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
      <Sparkles className="size-3.5" />
    </span>
  );
}

function CategoryPromoPanel({ megaMenu }) {
  return (
    <NavLink
      to={megaMenu.ctaPath}
      className="group relative block h-full min-h-52 overflow-hidden rounded-2xl bg-[#FBF4E4] ring-1 ring-[#EFE7D8]"
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
      <div className="absolute inset-0 bg-linear-to-t from-black/75 via-black/20 to-transparent" />

      <div className="relative flex h-full flex-col justify-end gap-1 p-5">
        <p className="font-nav text-lg font-medium text-white drop-shadow-sm">{megaMenu.name}</p>
        {megaMenu.description && (
          <p className="line-clamp-2 text-xs text-white/85">{megaMenu.description}</p>
        )}
        <span className="mt-2 inline-flex w-fit items-center gap-1.5 text-xs font-semibold tracking-wide text-[#FCE08B] uppercase">
          Explore Collection <ArrowRight className="size-3.5 transition-transform duration-300 group-hover:translate-x-1" />
        </span>
      </div>
    </NavLink>
  );
}

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
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl bg-[#FFF9EF] p-8 text-center border border-[#EFE7D8]">
        <Sparkles className="size-8 text-[#C8A24D] mb-2" />
        <p className="text-sm font-medium text-[#2A080C]">Curated Masterpieces</p>
        <p className="text-xs text-[#8A8378] mt-1 max-w-sm">
          Discover our exquisite jewellery crafted with certified gold & diamonds.
        </p>
      </div>
    );
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
                  <Sparkles className="size-6" />
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
  { key: 'category', label: 'Categories' },
  { key: 'price', label: 'By Price' },
  { key: 'occasion', label: 'By Occasion' },
  { key: 'gender', label: 'By Gender' },
];

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
    <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-8 py-7 lg:grid-cols-[160px_1fr_300px]">
      <div className="flex gap-1 overflow-x-auto lg:flex-col lg:gap-1 lg:overflow-visible lg:border-r lg:border-[#EFE6D3] lg:pr-4">
        {availableTabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={cn(
              'font-nav cursor-pointer shrink-0 rounded-lg px-3 py-2 text-left text-xs sm:text-sm whitespace-nowrap transition-all duration-200',
              tab === t.key ? 'bg-[#FFF9EF] text-[#9A6B12] font-semibold ring-1 ring-[#C8A24D]/30' : 'text-[#4A463F] hover:bg-[#FAF6EE] hover:text-[#9A6B12]'
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
                    className="font-nav flex items-center gap-2.5 rounded-lg px-2 py-2 text-xs sm:text-sm font-light text-[#4A463F] transition-all duration-200 hover:bg-[#FFF9EF] hover:text-[#C8A24D]"
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
              className="mt-5 inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#B88A2F] transition-colors duration-200 hover:text-[#C8A24D]"
            >
              {megaMenu.ctaLabel} <ArrowRight className="size-3.5" />
            </NavLink>
          </>
        )}

        {tab === 'category' && megaMenu.type === 'category-preview' && (
          <>
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-[#B88A2F]">{megaMenu.heading}</p>
            <CategoryProductPreview categorySlug={megaMenu.categorySlug} ctaPath={megaMenu.ctaPath} />
            <NavLink
              to={megaMenu.ctaPath}
              className="mt-5 inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#B88A2F] transition-colors duration-200 hover:text-[#C8A24D]"
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
                    className="font-nav block rounded-lg px-3 py-2.5 text-xs sm:text-sm font-light text-[#4A463F] ring-1 ring-[#EFE6D3] transition-all duration-200 hover:bg-[#FFF9EF] hover:text-[#C8A24D] hover:ring-[#C8A24D]/40"
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
                    className="font-nav flex items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-xs sm:text-sm font-light text-[#4A463F] ring-1 ring-[#EFE6D3] transition-all duration-200 hover:bg-[#FFF9EF] hover:text-[#C8A24D] hover:ring-[#C8A24D]/40"
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
                    className="font-nav flex items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-xs sm:text-sm font-light text-[#4A463F] ring-1 ring-[#EFE6D3] transition-all duration-200 hover:bg-[#FFF9EF] hover:text-[#C8A24D] hover:ring-[#C8A24D]/40"
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

export function CategoryNav() {
  const { data: categories } = useNavbarCategories();
  const { data: customItems } = usePublicNavbarItems();
  const [openIndex, setOpenIndex] = useState(null);
  const [menuRect, setMenuRect] = useState(null);
  const closeTimer = useRef(null);
  const navRef = useRef(null);

  // Reorganized nav list: Categories first, then Mudrika Brand, then New Arrivals/Offers/More
  const categoryNavItems = useMemo(() => buildNavCategoryItems(categories ?? []), [categories]);

  const navItems = useMemo(
    () => [
      ...categoryNavItems,
      NAV_FEATURED_BRAND,
      ...NAV_STATIC_AFTER,
    ],
    [categoryNavItems]
  );

  const openMenu = (index) => {
    clearTimeout(closeTimer.current);
    setOpenIndex(index);
  };

  const scheduleClose = () => {
    closeTimer.current = setTimeout(() => setOpenIndex(null), 180);
  };

  const activeItem = openIndex !== null ? navItems[openIndex] : null;

  // Auto-dismiss mega menu on scroll to prevent detached overlays
  useEffect(() => {
    const handleScroll = () => {
      if (openIndex !== null) setOpenIndex(null);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [openIndex]);

  // Update position on hover and window resize
  useEffect(() => {
    if (!activeItem || !navRef.current) {
      setMenuRect(null);
      return undefined;
    }

    const updateRect = () => {
      if (!navRef.current) return;
      const rect = navRef.current.getBoundingClientRect();
      setMenuRect({ top: rect.bottom, left: 0, width: window.innerWidth });
    };
    updateRect();

    window.addEventListener('resize', updateRect);
    return () => window.removeEventListener('resize', updateRect);
  }, [activeItem]);

  return (
    <nav
      ref={navRef}
      className="relative hidden border-b border-[#EFE7D8] bg-[#FAF8F4] lg:block"
      onMouseLeave={scheduleClose}
    >
      <div className="mx-auto flex max-w-7xl items-center px-4 sm:px-6 lg:px-8">
        {/* Shop By Category Dropdown Button */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="cursor-pointer font-nav my-1.5 mr-2 flex shrink-0 items-center gap-2 rounded-xl border border-[#EAE0CD] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#2B1B0E] shadow-2xs transition-all duration-200 hover:border-[#C8A24D] hover:bg-[#FFF9EF] hover:text-[#9A6B12]"
            >
              <LayoutGrid className="size-3.5 text-[#C8A24D]" />
              Shop by Category
              <ChevronDown className="size-3 text-[#9A9180]" />
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="start"
            className="w-68 rounded-2xl border border-[#EFE7D8] bg-white p-2 shadow-[0_15px_45px_rgba(0,0,0,0.08)] z-[70]"
          >
            <div className="px-3 py-1.5 text-[11px] font-bold tracking-wider text-[#9A6B12] uppercase">
              All Jewellery Categories
            </div>
            {((categories && categories.length > 0) ? categories : DEFAULT_CATEGORIES_FALLBACK).map((cat) => (
              <DropdownMenuItem
                key={cat.id || cat.slug}
                asChild
                className="rounded-xl transition-colors focus:bg-[#FFF9EF] cursor-pointer"
              >
                <NavLink
                  to={categoryPath(cat.slug || cat.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'))}
                  className="font-nav flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-medium text-[#3F3A33] transition-all duration-200 hover:text-[#9A6B12]"
                >
                  <span>{cat.name}</span>
                  <ChevronRight className="size-3 text-[#C8A24D]/60" />
                </NavLink>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator className="my-1 bg-[#EFE7D8]" />
            <DropdownMenuItem asChild className="rounded-xl focus:bg-[#FFF9EF] cursor-pointer">
              <NavLink
                to="/categories"
                className="font-nav flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold text-[#9A6B12]"
              >
                <span>View All Categories</span>
                <ArrowRight className="size-3" />
              </NavLink>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="h-5 w-px bg-[#EFE7D8] mr-2" />

        {/* Main Navigation Row */}
        <div className="relative min-w-0 flex-1">
          <ul className="scrollbar-none flex items-center overflow-x-auto gap-0.5 sm:gap-1 py-1">
            {navItems.map((item, index) => {
              const isMudrika = item.path === '/mudrika';

              if (isMudrika) {
                return (
                  <li key={item.path} className="shrink-0 mx-1">
                    <NavLink
                      to={item.path}
                      className={({ isActive }) =>
                        cn(
                          "inline-flex items-center gap-1.5 rounded-full bg-linear-to-r from-[#2A080C] via-[#3E0C12] to-[#1A0407] px-3.5 py-1 text-xs font-semibold tracking-wide text-[#FCE08B] border border-[#D4AF37]/50 shadow-xs transition-all duration-200 hover:scale-105 hover:border-[#D4AF37] hover:text-white",
                          isActive && "ring-2 ring-[#D4AF37] text-white shadow-md shadow-amber-950/20"
                        )
                      }
                    >
                      <Sparkles className="size-3 text-[#FCE08B] animate-pulse" />
                      <span>MUDRIKA</span>
                      <span className="rounded-full bg-[#D4AF37]/30 px-1.5 py-0.2 text-[8.5px] font-bold text-[#FCE08B] tracking-wider uppercase">
                        Brand
                      </span>
                    </NavLink>
                  </li>
                );
              }

              return (
                <li
                  key={item.path}
                  className="relative shrink-0"
                  onMouseEnter={() => item.megaMenu && openMenu(index)}
                >
                  <NavLink
                    to={item.path}
                    onFocus={() => item.megaMenu && openMenu(index)}
                    className={({ isActive }) =>
                      cn(
                        "font-nav relative flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs sm:text-[13px] font-medium whitespace-nowrap text-[#4A443A] transition-all duration-200 hover:bg-[#FFF9EF] hover:text-[#9A6B12]",
                        isActive && "text-[#9A6B12] font-semibold bg-[#FAF4E6]",
                        item.highlight && !isActive && "text-[#9A6B12]"
                      )
                    }
                  >
                    {item.icon && <item.icon className="size-3.5 text-[#B88A2F]/70" />}
                    {item.label}

                    {item.megaMenu && (
                      <ChevronDown
                        className={cn(
                          "size-3 transition-all duration-200",
                          openIndex === index
                            ? "rotate-180 text-[#C8A24D]"
                            : "text-[#9A9180]"
                        )}
                      />
                    )}

                    {item.badge && (
                      <Badge className="ml-1 h-4.5 rounded-full bg-[#C8A24D] px-1.5 text-[8.5px] font-semibold text-white shadow-xs">
                        {item.badge}
                      </Badge>
                    )}
                  </NavLink>
                </li>
              );
            })}

            {/* Custom Admin Items */}
            {(customItems ?? []).map((item) => (
              <li key={item.id} className="shrink-0">
                <SmartLink
                  to={item.path}
                  target={item.openInNewTab ? '_blank' : undefined}
                  rel={item.openInNewTab ? 'noopener noreferrer' : undefined}
                  className="font-nav flex items-center rounded-lg px-2.5 py-1.5 text-xs sm:text-[13px] font-medium whitespace-nowrap text-[#4A443A] transition-all duration-200 hover:bg-[#FFF9EF] hover:text-[#9A6B12]"
                >
                  {item.label}
                </SmartLink>
              </li>
            ))}
          </ul>

          {/* Fade hint */}
          <div className="pointer-events-none absolute top-0 right-0 h-full w-8 bg-linear-to-l from-[#FAF8F4] to-transparent" />
        </div>
      </div>

      {/* Portaled Mega Menu */}
      {createPortal(
        <AnimatePresence>
          {activeItem?.megaMenu && menuRect && (
            <motion.div
              key={activeItem.label}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              onMouseEnter={() => openMenu(openIndex)}
              onMouseLeave={scheduleClose}
              style={{ position: 'fixed', top: menuRect.top, left: 0, width: '100vw' }}
              className="z-[60] border-t border-[#EFE7D8] bg-white/98 backdrop-blur-xl shadow-[0_25px_60px_rgba(27,15,5,0.12)]"
            >
              {activeItem.megaMenu.type === 'category' || activeItem.megaMenu.type === 'category-preview' ? (
                <CategoryMegaMenuPanel key={activeItem.label} megaMenu={activeItem.megaMenu} />
              ) : (
                <div className="mx-auto grid max-w-7xl grid-cols-2 gap-10 px-10 py-8 sm:grid-cols-3">
                  {activeItem.megaMenu.columns?.map((col) => (
                    <div key={col.heading}>
                      <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-[#B88A2F]">
                        {col.heading}
                      </p>

                      <ul className="space-y-1">
                        {col.links.map((link) => (
                          <li key={link.path}>
                            <NavLink
                              to={link.path}
                              className="font-nav block rounded-lg px-3 py-2 text-xs sm:text-sm font-light text-[#4A463F] transition-all duration-200 hover:bg-[#FFF9EF] hover:text-[#C8A24D]"
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
