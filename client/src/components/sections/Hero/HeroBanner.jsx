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

// Optimal aspect ratio scale for Indian jewellery e-commerce hero banners:
// Preserves top headline & model head without cropping across mobile to desktop.
const HERO_ASPECT_CLASSES = 'aspect-[16/9] sm:aspect-[2/1] lg:aspect-[2.35/1] xl:aspect-[2.5/1]';

function useHeroSlides() {
  const { data: banners, isLoading } = useBanners('homepage_hero');

  const slides = useMemo(() => {
    if (!banners?.length) return HERO_SLIDES;

    return banners.map((banner) => {
      const hasExplicitText = Boolean(banner.subtitle || banner.description);
      return {
        key: banner.id,
        eyebrow: banner.subtitle,
        heading: hasExplicitText ? banner.title : null,
        description: banner.description,
        image: banner.primaryMedia,
        linkUrl: banner.linkUrl || '/products',
        hasOverlayText: hasExplicitText || !banner.primaryMedia,
        ctas: banner.linkUrl ? [{ label: banner.ctaLabel || 'Shop Now', path: banner.linkUrl }] : [],
      };
    });
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
            {slides.map((slide) => {
              const isGraphicBanner = Boolean(slide.image && !slide.hasOverlayText);
              const SlideWrapper = isGraphicBanner && slide.linkUrl ? SmartLink : 'div';
              const wrapperProps = isGraphicBanner && slide.linkUrl
                ? {
                    to: slide.linkUrl,
                    onClick: () => track('banner_click', { metadata: { bannerId: slide.key, destination: slide.linkUrl } }),
                    className: cn('relative block w-full min-w-0 flex-[0_0_100%] overflow-hidden', HERO_ASPECT_CLASSES),
                  }
                : {
                    className: cn('relative w-full min-w-0 flex-[0_0_100%] overflow-hidden', HERO_ASPECT_CLASSES),
                  };

              return (
                <SlideWrapper key={slide.key ?? slide.heading} {...wrapperProps}>
                  <div className="absolute inset-0 size-full">
                    <HeroVisual image={slide.image} />
                  </div>

                  {slide.hasOverlayText && (
                    <>
                      <div className="absolute inset-0 bg-linear-to-t from-black/75 via-black/35 to-black/10" />

                      <div className="relative flex size-full flex-col justify-end p-6 sm:justify-center sm:px-16 sm:py-12 lg:px-20 lg:py-16">
                        <div className="flex max-w-lg flex-col items-start gap-3 sm:gap-4">
                          {slide.eyebrow && (
                            <span className="flex items-center gap-2 text-xs font-semibold tracking-[0.2em] text-[#FCE08B] uppercase">
                              <span className="h-px w-6 bg-[#D4AF37]" />
                              {slide.eyebrow}
                            </span>
                          )}
                          {slide.heading && (
                            <h1 className="text-h2 font-display font-bold text-white drop-shadow-sm sm:text-h1 lg:text-display">
                              {slide.heading}
                            </h1>
                          )}
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
                    </>
                  )}
                </SlideWrapper>
              );
            })}
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
