import { useCallback, useEffect, useMemo, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { SmartLink } from '@/components/global/SmartLink';
import { track } from '@/lib/analytics';
import { cn } from '@/lib/utils';
import { useBanners } from '@/features/banners/bannersApi';
import { HERO_SLIDES } from '@/data/heroSlides';
import { HeroVisual } from './HeroVisual';

// A ratio close to a real uploaded photo's own shape (a landscape banner,
// not a tall box) - the earlier fixed min-height boxes were tall/narrow
// relative to a normal photo, which is why object-position couldn't help:
// with the box far taller than the image's own ratio, object-cover has no
// vertical overflow left to crop at all, so the entire image (including
// its own empty/dark margins) always shows, just zoomed in on width.
const HERO_ASPECT_CLASSES = 'aspect-4/3 sm:aspect-16/7 lg:aspect-21/7';

// Real CMS banners (Admin -> CMS -> Banners, position "Homepage hero") win
// once at least one exists; the static HERO_SLIDES are only ever the
// fallback so the homepage never looks broken/empty before anyone sets one
// up.
//
// `isLoading` is surfaced too - HeroBanner renders a skeleton while it's
// true, rather than briefly showing the static fallback and then swapping
// to real banners a moment later.
function useHeroSlides() {
  const { data: banners, isLoading } = useBanners('homepage_hero');

  const slides = useMemo(() => {
    if (!banners?.length) return HERO_SLIDES;

    return banners.map((banner) => ({
      key: banner.id,
      eyebrow: banner.subtitle,
      heading: banner.title,
      description: banner.description,
      image: banner.primaryMedia,
      // Only the banner's own CTA - "All Products" lives in its own strip
      // below the category nav now, not stacked in here too.
      ctas: banner.linkUrl ? [{ label: banner.ctaLabel || 'Shop Now', path: banner.linkUrl }] : [],
    }));
  }, [banners]);

  return { slides, isLoading };
}

function HeroSkeleton() {
  return (
    <section className="w-full min-w-0">
      <Skeleton className={cn('w-full', HERO_ASPECT_CLASSES)} />
    </section>
  );
}

// A full-bleed background-image hero (image behind, text overlaid on a
// dark scrim), flush against the header edge to edge - like tanishq.co.in's
// homepage banner - rather than a padded, rounded "card" floating in a
// container. Looks intentional with ANY single photo.
export function HeroBanner() {
  const { slides, isLoading } = useHeroSlides();
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [
    Autoplay({ delay: 5500, stopOnInteraction: false, stopOnMouseEnter: true }),
  ]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);
  const scrollTo = useCallback((index) => emblaApi?.scrollTo(index), [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return undefined;
    const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap());
    onSelect();
    emblaApi.on('select', onSelect).on('reInit', onSelect);
    return () => emblaApi.off('select', onSelect).off('reInit', onSelect);
  }, [emblaApi, slides]);

  if (isLoading) return <HeroSkeleton />;

  return (
    <section className="w-full min-w-0">
      <div className="relative w-full overflow-hidden">
        <div className="w-full overflow-hidden" ref={emblaRef}>
          <div className="flex w-full">
            {slides.map((slide) => (
              <div key={slide.key ?? slide.heading} className={cn('relative w-full min-w-0 flex-[0_0_100%]', HERO_ASPECT_CLASSES)}>
                <div className="absolute inset-0 size-full">
                  <HeroVisual image={slide.image} />
                </div>
                {/* Scrim - keeps white text readable over any photo,
                    light or dark. */}
                <div className="absolute inset-0 bg-linear-to-t from-black/75 via-black/35 to-black/10" />

                <div className="relative flex size-full flex-col justify-end p-6 sm:justify-center sm:p-12 lg:p-16">
                  <div className="flex max-w-lg flex-col items-start gap-3 sm:gap-4">
                    {slide.eyebrow && (
                      <span className="flex items-center gap-2 text-xs font-semibold tracking-[0.2em] text-primary uppercase">
                        <span className="h-px w-6 bg-primary/70" />
                        {slide.eyebrow}
                      </span>
                    )}
                    <h1 className="text-h2 font-display font-bold text-white drop-shadow-sm sm:text-h1 lg:text-display">
                      {slide.heading}
                    </h1>
                    {slide.description && <p className="max-w-md text-sm text-white/85 sm:text-base">{slide.description}</p>}
                    {slide.ctas?.length > 0 && (
                      <div className="mt-1 flex flex-wrap items-center gap-3 sm:mt-2">
                        {slide.ctas.map((cta) => (
                          <Button
                            key={cta.path}
                            asChild
                            size="lg"
                            className="rounded-button px-6 shadow-lg shadow-primary/30 transition-transform duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/40"
                          >
                            <SmartLink
                              to={cta.path}
                              onClick={() => track('banner_click', { metadata: { bannerId: slide.key, destination: cta.path } })}
                            >
                              {cta.label}
                            </SmartLink>
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={scrollPrev}
          aria-label="Previous slide"
          className="absolute top-1/2 left-3 hidden size-10 -translate-y-1/2 items-center justify-center rounded-full bg-card/90 text-foreground shadow-md transition-colors hover:text-primary sm:flex"
        >
          <ChevronLeft className="size-5" />
        </button>
        <button
          type="button"
          onClick={scrollNext}
          aria-label="Next slide"
          className="absolute top-1/2 right-3 hidden size-10 -translate-y-1/2 items-center justify-center rounded-full bg-card/90 text-foreground shadow-md transition-colors hover:text-primary sm:flex"
        >
          <ChevronRight className="size-5" />
        </button>

        {slides.length > 1 && (
          <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 items-center gap-2">
            {slides.map((slide, index) => (
              <button
                key={slide.key ?? slide.heading}
                type="button"
                aria-label={`Go to slide ${index + 1}`}
                onClick={() => scrollTo(index)}
                className={cn(
                  'h-2 rounded-full transition-all duration-300',
                  selectedIndex === index ? 'w-6 bg-primary' : 'w-2 bg-white/40 hover:bg-white/70'
                )}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
