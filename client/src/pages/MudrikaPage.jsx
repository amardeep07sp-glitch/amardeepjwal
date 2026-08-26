import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Crown, MessageCircle, Phone, Sparkles } from 'lucide-react';
import { useProductList } from '@/features/products/productsApi';
import { useBrandBySlug } from '@/features/brands/brandsApi';
import { getBrandShowcaseIcon } from '@/lib/brandShowcaseIcons';
import { ProductCard, ProductCardSkeleton } from '@/components/product';
import { Breadcrumb } from '@/components/global/Breadcrumb';
import { BackButton } from '@/components/global/BackButton';
import { ErrorState } from '@/components/global/ErrorState';
import { PageContainer } from '@/components/global/PageContainer';
import { ResponsiveGrid } from '@/components/global/ResponsiveGrid';
import { Pagination } from '@/components/global/Pagination';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useSeo } from '@/hooks/useSeo';
import { SUPPORT_PHONE } from '@/config/appConfig';
import { track } from '@/lib/analytics';
import { cn } from '@/lib/utils';

// The slug this flagship showcase page is wired to - every piece of
// content below (hero copy, story, filter chips, craft process, trust
// benefits, product catalog) comes from this one real Brand record
// (Admin -> Catalog -> Brands -> Mudrika -> "Showcase page" section), not
// hardcoded here. `npm run seed:mudrika` (backend/) creates it the first
// time with its real launch copy already filled in.
const BRAND_SLUG = 'mudrika';

const SORT_OPTIONS = [
  { value: 'featured', label: 'Featured Pieces' },
  { value: 'newest', label: 'Newest Arrivals' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
];

const PAGE_SIZE = 12;

export default function MudrikaPage() {
  const [selectedCategorySlug, setSelectedCategorySlug] = useState(null);
  const [sortBy, setSortBy] = useState('featured');
  const [page, setPage] = useState(1);
  const catalogRef = useRef(null);

  const { data: brand, isLoading: isBrandLoading, isError, error, refetch } = useBrandBySlug(BRAND_SLUG);
  const showcase = brand?.showcase;

  useSeo({
    title: brand?.seo?.metaTitle || (brand ? `${brand.name} — Amardeep Swarna Kala Kendra` : undefined),
    description: brand?.seo?.metaDescription || brand?.description,
  });

  useEffect(() => {
    if (!brand) return;
    track('page_view', { pageType: 'brand_showcase', metadata: { brandId: brand.id, brandSlug: BRAND_SLUG } });
  }, [brand]);

  const editions = useMemo(
    () => [{ id: 'all', name: `All ${brand?.name ?? ''} Pieces`, categorySlug: null }, ...(showcase?.editions ?? [])],
    [brand?.name, showcase?.editions]
  );
  const [selectedEditionId, setSelectedEditionId] = useState('all');

  const { data: productsData, isLoading: isProductsLoading } = useProductList({
    page,
    limit: PAGE_SIZE,
    brand: BRAND_SLUG,
    category: selectedCategorySlug || undefined,
    sortBy,
  });

  const scrollToCatalog = () => catalogRef.current?.scrollIntoView({ behavior: 'smooth' });
  const handlePageChange = (nextPage) => {
    setPage(nextPage);
    catalogRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  const handleEditionSelect = (edition) => {
    setSelectedEditionId(edition.id);
    setSelectedCategorySlug(edition.categorySlug || null);
    setPage(1);
  };

  const whatsappMessage = brand
    ? encodeURIComponent(`Namaste Amardeep Jewels, I am interested in the ${brand.name.toUpperCase()} Signature Collection. Please connect me with a personal jewellery consultant.`)
    : '';
  const whatsappUrl = `https://wa.me/${SUPPORT_PHONE.replace(/[^0-9]/g, '')}?text=${whatsappMessage}`;

  if (isBrandLoading) {
    return (
      <PageContainer top="md" bottom="md">
        <Skeleton className="aspect-16/7 w-full rounded-2xl" />
      </PageContainer>
    );
  }

  if (isError) {
    return (
      <PageContainer top="md" bottom="md">
        <ErrorState description={error?.message} actionLabel="Retry" onAction={refetch} />
      </PageContainer>
    );
  }

  if (!brand) return null;

  const storyParagraphs = (showcase?.storyBody ?? '').split('\n\n').filter(Boolean);

  return (
    <div className="min-h-screen bg-[#FCFBF8] text-[#2A2621]">
      {/* TOP BREADCRUMB & BRAND BAR */}
      <div className="border-b border-[#EFE7D8] bg-[#FAF8F5] px-4 py-3 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <BackButton />
            <Breadcrumb items={[{ label: 'Home', to: '/' }, { label: 'Brands', to: '/brands' }, { label: brand.name }]} />
          </div>
          <Badge className="border-0 bg-linear-to-r from-[#B8860B] via-[#D4AF37] to-[#996515] px-2.5 py-0.5 text-[10px] font-semibold tracking-wider text-white uppercase shadow-xs">
            {brand.name}
          </Badge>
        </div>
      </div>

      {/* CINEMATIC HERO */}
      <section className="relative overflow-hidden bg-[#1E0508] text-white">
        <div className="absolute inset-0 z-0">
          {(showcase?.heroImageMedia ?? brand.bannerMedia) && (
            <img
              src={(showcase?.heroImageMedia ?? brand.bannerMedia).secureUrl}
              alt={brand.name}
              className="size-full scale-105 object-cover object-center opacity-40"
            />
          )}
          <div className="absolute inset-0 bg-linear-to-t from-[#160306] via-[#1E0508]/80 to-[#160306]/95" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(212,175,55,0.18)_0%,transparent_70%)]" />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-18 lg:px-8 lg:py-24">
          <div className="max-w-3xl space-y-5">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/40 bg-[#350C11]/80 px-4 py-1.5 shadow-lg shadow-black/30 backdrop-blur-md"
            >
              <Crown className="size-3.5 text-[#FCE08B]" />
              <span className="text-[11px] font-semibold tracking-[0.25em] text-[#FCE08B] uppercase">
                House of Amardeep • In-House Haute Joaillerie
              </span>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1 }} className="space-y-2">
              {showcase?.heroLocalName && (
                <div className="flex items-center gap-3">
                  <span className="font-serif text-2xl font-light tracking-widest text-[#E5C058]/80 sm:text-3xl">{showcase.heroLocalName}</span>
                  <span className="h-px w-12 bg-linear-to-r from-[#D4AF37] to-transparent" />
                </div>
              )}
              <h1 className="font-display text-4xl font-bold tracking-tight text-white sm:text-6xl lg:text-7xl">{brand.name.toUpperCase()}</h1>
              {showcase?.heroTagline && <p className="font-serif text-xl italic text-[#F3E3B5] sm:text-2xl lg:text-3xl">{showcase.heroTagline}</p>}
            </motion.div>

            {brand.description && (
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.2 }}
                className="max-w-2xl text-sm leading-relaxed text-white/80 sm:text-base"
              >
                {brand.description}
              </motion.p>
            )}

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="flex flex-wrap items-center gap-4 pt-2"
            >
              <button
                type="button"
                onClick={scrollToCatalog}
                className="group inline-flex cursor-pointer items-center gap-2.5 rounded-xl bg-linear-to-r from-[#D4AF37] via-[#E5C058] to-[#B8860B] px-6 py-3.5 text-sm font-semibold tracking-wide text-[#1A0407] shadow-xl shadow-amber-950/40 transition-all duration-300 hover:scale-[1.02] hover:shadow-amber-500/25"
              >
                <Sparkles className="size-4 transition-transform group-hover:rotate-12" />
                Explore The Collection
              </button>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-5 py-3.5 text-sm font-medium text-white backdrop-blur-md transition-all duration-300 hover:border-[#D4AF37] hover:bg-[#350C11]/80 hover:text-[#FCE08B]"
              >
                <MessageCircle className="size-4 text-[#25D366]" />
                Book VIP Consultation
              </a>
            </motion.div>
          </div>
        </div>

        <div className="h-1.5 w-full bg-linear-to-r from-[#996515] via-[#FCE08B] to-[#996515]" />
      </section>

      {/* HERITAGE STORY */}
      {(showcase?.storyTitle || storyParagraphs.length > 0) && (
        <section className="border-b border-[#EFE7D8] bg-white py-16 sm:py-24">
          <PageContainer top="none" bottom="none">
            <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
              {showcase?.storyImageMedia && (
                <div className="group relative lg:col-span-5">
                  <div className="relative overflow-hidden rounded-2xl border-2 border-[#D4AF37]/40 bg-[#160306] shadow-2xl">
                    <img src={showcase.storyImageMedia.secureUrl} alt={brand.name} className="size-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/15 to-transparent" />
                  </div>
                  <div className="absolute -inset-2 -z-10 rounded-3xl bg-linear-to-r from-[#D4AF37]/20 to-[#996515]/20 opacity-60 blur-xl" />
                </div>
              )}
              <div className={cn('space-y-6', showcase?.storyImageMedia ? 'lg:col-span-7' : 'lg:col-span-12')}>
                <div className="space-y-2">
                  <span className="text-xs font-semibold tracking-[0.2em] text-[#9A6B12] uppercase">The Brand Story</span>
                  {showcase?.storyTitle && <h2 className="font-display text-3xl font-bold tracking-tight text-[#2B1B0E] sm:text-4xl">{showcase.storyTitle}</h2>}
                </div>
                {storyParagraphs.map((para, i) => (
                  <p key={i} className="text-base leading-relaxed text-[#5F5748]">
                    {para}
                  </p>
                ))}
              </div>
            </div>
          </PageContainer>
        </section>
      )}

      {/* CATALOG */}
      <section ref={catalogRef} className="py-16 sm:py-24">
        <PageContainer top="none" bottom="none">
          <div className="mb-10 flex flex-col items-center space-y-3 text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-[#FFF3D6] px-3.5 py-1 text-xs font-semibold tracking-wider text-[#8A5D07] uppercase">
              <Sparkles className="size-3.5" /> {brand.name} Catalog
            </span>
            <h2 className="font-display text-3xl font-bold tracking-tight text-[#2B1B0E] sm:text-4xl">Curated Masterpieces</h2>
          </div>

          {editions.length > 1 && (
            <div className="scrollbar-none mb-8 flex items-center justify-start gap-2.5 overflow-x-auto pb-2 sm:justify-center">
              {editions.map((edition) => {
                const isSelected = selectedEditionId === edition.id;
                return (
                  <button
                    key={edition.id ?? edition.categorySlug}
                    type="button"
                    onClick={() => handleEditionSelect(edition)}
                    className={cn(
                      'group flex shrink-0 cursor-pointer items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-medium shadow-xs transition-all duration-300 sm:text-sm',
                      isSelected
                        ? 'bg-[#1E0508] text-[#FCE08B] ring-2 ring-[#D4AF37] shadow-md'
                        : 'border border-[#EBE3D3] bg-white text-[#4A443A] hover:border-[#D4AF37] hover:bg-[#FFF9EF] hover:text-[#9A6B12]'
                    )}
                  >
                    <span className={cn('size-2 rounded-full', isSelected ? 'bg-[#FCE08B]' : 'bg-[#D4AF37]/50')} />
                    <span>{edition.name}</span>
                  </button>
                );
              })}
            </div>
          )}

          <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[#EFE7D8] bg-white p-3.5 shadow-xs">
            <div className="flex items-center gap-2 text-sm text-[#6C6454]">
              <Crown className="size-4 text-[#9A6B12]" />
              <span>
                Showing <strong className="text-[#2B1B0E]">{productsData?.meta?.totalItems ?? 0}</strong> {brand.name} pieces
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-medium text-[#7C7464]">Sort by:</span>
              <Select value={sortBy} onValueChange={(val) => { setSortBy(val); setPage(1); }}>
                <SelectTrigger className="h-9 w-44 border-[#EFE7D8] bg-[#FAF7F0] text-xs font-medium sm:text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {isProductsLoading ? (
            <ResponsiveGrid count={PAGE_SIZE} className="gap-5 sm:gap-6">
              {Array.from({ length: PAGE_SIZE }).map((_, i) => <ProductCardSkeleton key={i} />)}
            </ResponsiveGrid>
          ) : (productsData?.items?.length ?? 0) === 0 ? (
            <div className="rounded-2xl border border-[#EFE7D8] bg-white p-12 text-center shadow-xs">
              <Crown className="mx-auto mb-3 size-12 text-[#D4AF37]/50" />
              <h3 className="font-display text-xl font-bold text-[#2B1B0E]">New {brand.name} Designs Coming Soon</h3>
              <p className="mx-auto mt-1 max-w-md text-sm text-[#736B5C]">
                Our master karigars are currently crafting the next signature batch. Browse our full fine jewelry collection in the meantime.
              </p>
              <div className="mt-6 flex justify-center gap-3">
                <Button asChild variant="outline">
                  <Link to="/products">View All Jewellery</Link>
                </Button>
                <Button asChild className="bg-[#1E0508] text-[#FCE08B] hover:bg-[#350C11]">
                  <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">Request Custom {brand.name}</a>
                </Button>
              </div>
            </div>
          ) : (
            <>
              <ResponsiveGrid count={productsData.items.length} className="gap-5 sm:gap-6">
                {productsData.items.map((product) => <ProductCard key={product.id} product={product} />)}
              </ResponsiveGrid>
              {productsData?.meta?.totalPages > 1 && (
                <div className="mt-10">
                  <Pagination page={productsData.meta.page} totalPages={productsData.meta.totalPages} totalItems={productsData.meta.totalItems} onPageChange={handlePageChange} />
                </div>
              )}
            </>
          )}
        </PageContainer>
      </section>

      {/* CRAFT PROCESS */}
      {showcase?.craftPillars?.length > 0 && (
        <section className="border-y border-[#EFE7D8] bg-[#FAF7F0] py-16 sm:py-24">
          <PageContainer top="none" bottom="none">
            <div className="mb-14 flex flex-col items-center space-y-3 text-center">
              <span className="text-xs font-semibold tracking-[0.2em] text-[#9A6B12] uppercase">Artisan Precision</span>
              <h2 className="font-display text-3xl font-bold tracking-tight text-[#2B1B0E] sm:text-4xl">The Making of a {brand.name} Masterpiece</h2>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {showcase.craftPillars.map((pillar, i) => {
                const Icon = getBrandShowcaseIcon(pillar.icon);
                return (
                  <div
                    key={pillar.title}
                    className="group relative flex flex-col justify-between rounded-2xl border border-[#EBE3D3] bg-white p-6 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-[#D4AF37] hover:shadow-lg hover:shadow-amber-900/5"
                  >
                    <div>
                      <div className="mb-4 flex items-center justify-between">
                        <span className="font-serif text-3xl font-bold text-[#E5C058]/60 transition-colors group-hover:text-[#9A6B12]">
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        <div className="flex size-10 items-center justify-center rounded-xl bg-[#FFF8EB] text-[#9A6B12] transition-colors group-hover:bg-[#1E0508] group-hover:text-[#FCE08B]">
                          <Icon className="size-5" />
                        </div>
                      </div>
                      <h3 className="mb-2 font-display text-lg font-bold text-[#2B1B0E]">{pillar.title}</h3>
                      {pillar.description && <p className="text-xs leading-relaxed text-[#6C6454]">{pillar.description}</p>}
                    </div>
                    <div className="mt-6 h-1 w-full overflow-hidden rounded-full bg-[#FAF7F0]">
                      <div className="h-full w-1/3 bg-linear-to-r from-[#D4AF37] to-[#996515] transition-all duration-500 group-hover:w-full" />
                    </div>
                  </div>
                );
              })}
            </div>
          </PageContainer>
        </section>
      )}

      {/* TRUST BENEFITS */}
      {showcase?.trustBenefits?.length > 0 && (
        <section className="border-b border-[#EFE7D8] bg-white py-14 sm:py-18">
          <PageContainer top="none" bottom="none">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {showcase.trustBenefits.map((item) => {
                const Icon = getBrandShowcaseIcon(item.icon);
                return (
                  <div key={item.title} className="flex items-start gap-3.5 rounded-xl border border-[#EFE7D8] bg-[#FCFBF8] p-4">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#FFF3D6] text-[#9A6B12]">
                      <Icon className="size-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-[#2B1B0E]">{item.title}</h4>
                      {item.description && <p className="mt-0.5 text-xs leading-relaxed text-[#736B5C]">{item.description}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </PageContainer>
        </section>
      )}

      {/* BESPOKE CTA */}
      <section className="py-16 sm:py-20">
        <PageContainer top="none" bottom="none">
          <div className="relative overflow-hidden rounded-3xl border-2 border-[#D4AF37]/50 bg-linear-to-br from-[#1E0508] via-[#2D0A0F] to-[#160306] p-8 text-white shadow-2xl sm:p-14">
            <div className="absolute top-0 right-0 z-0 size-96 rounded-full bg-[#D4AF37]/15 blur-3xl" />
            <div className="absolute bottom-0 left-0 z-0 size-96 rounded-full bg-[#7B0D19]/30 blur-3xl" />
            <div className="relative z-10 mx-auto max-w-3xl space-y-6 text-center">
              <span className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/40 bg-black/40 px-4 py-1.5 text-xs font-semibold tracking-widest text-[#FCE08B] uppercase backdrop-blur-md">
                <Crown className="size-3.5" /> Bespoke {brand.name} Atelier
              </span>
              <h2 className="font-display text-3xl font-bold tracking-tight text-white sm:text-5xl">Dreaming of a Custom Royal Piece?</h2>
              <p className="text-sm leading-relaxed text-white/80 sm:text-base">
                Whether you desire a custom-sized family heirloom signet, a royal Solitaire wedding band, or personalized Hindi/Sanskrit laser
                engraving, our master jewelry concierge is at your service.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2.5 rounded-xl bg-linear-to-r from-[#D4AF37] via-[#E5C058] to-[#B8860B] px-7 py-3.5 text-sm font-semibold tracking-wide text-[#1A0407] shadow-xl transition-all duration-300 hover:scale-105 hover:shadow-amber-500/30"
                >
                  <MessageCircle className="size-4 text-[#160306]" />
                  Chat on WhatsApp with Karigar
                </a>
                <a
                  href={`tel:${SUPPORT_PHONE}`}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-6 py-3.5 text-sm font-medium text-white backdrop-blur-md transition-all duration-300 hover:border-white hover:bg-white/20"
                >
                  <Phone className="size-4 text-[#FCE08B]" />
                  Call {SUPPORT_PHONE}
                </a>
              </div>
            </div>
          </div>
        </PageContainer>
      </section>
    </div>
  );
}
