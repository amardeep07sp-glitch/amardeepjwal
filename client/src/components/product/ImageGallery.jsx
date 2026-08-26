import { useState } from 'react';
import { ChevronLeft, ChevronRight, Gem, ZoomIn } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { track } from '@/lib/analytics';
import { cn } from '@/lib/utils';

// Cursor-follow zoom on the main image (no external lib) - mousemove sets
// the transform-origin to the pointer position and scales up; leaving
// resets both. Thumbnails (left, matching the reference layout) switch
// which image is "main"; arrows step through the same list.
export function ImageGallery({ images, name, badgeLabel, productId }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [zoomOrigin, setZoomOrigin] = useState('50% 50%');
  const [isZoomed, setIsZoomed] = useState(false);

  const active = images[activeIndex];
  const hasMultiple = images.length > 1;

  const handleMouseMove = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    setZoomOrigin(`${x}% ${y}%`);
  };

  const goTo = (delta) => setActiveIndex((i) => (i + delta + images.length) % images.length);

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      {hasMultiple && (
        <div className="flex shrink-0 gap-2 overflow-x-auto sm:flex-col sm:overflow-visible">
          {images.map((image, index) => (
            <button
              key={image._id ?? index}
              type="button"
              onClick={() => {
                setActiveIndex(index);
                track('image_click', { metadata: { productId, imageIndex: index } });
              }}
              aria-label={`Show image ${index + 1}`}
              className={cn(
                'size-16 shrink-0 overflow-hidden rounded-lg ring-2 transition-colors',
                activeIndex === index ? 'ring-primary' : 'ring-border hover:ring-primary/50'
              )}
            >
              <img src={image.thumbnailUrl || image.secureUrl} alt="" className="size-full object-contain" />
            </button>
          ))}
        </div>
      )}

      <div
        className="relative aspect-square w-full shrink-0 cursor-zoom-in overflow-hidden rounded-lg bg-secondary"
        onMouseMove={handleMouseMove}
        onMouseEnter={() => {
          setIsZoomed(true);
          track('product_zoom', { metadata: { productId } });
        }}
        onMouseLeave={() => setIsZoomed(false)}
      >
        {active ? (
          <img
            src={active.secureUrl}
            alt={active.altText || name}
            className="size-full object-contain transition-transform duration-200 ease-out"
            style={{ transformOrigin: zoomOrigin, transform: isZoomed ? 'scale(1.9)' : 'scale(1)' }}
          />
        ) : (
          <div className="flex size-full items-center justify-center bg-linear-to-br from-primary/10 via-secondary to-secondary">
            <Gem className="size-16 text-primary/40" strokeWidth={1.25} />
          </div>
        )}

        {badgeLabel && <Badge className="absolute top-3 left-3">{badgeLabel}</Badge>}

        {active && (
          <span className="absolute right-3 bottom-3 flex items-center gap-1 rounded-full bg-card/90 px-2.5 py-1 text-xs text-muted-foreground">
            <ZoomIn className="size-3.5" />
            Hover to Zoom
          </span>
        )}

        {hasMultiple && (
          <>
            <button
              type="button"
              onClick={() => goTo(-1)}
              aria-label="Previous image"
              className="absolute top-1/2 left-3 flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-card/90 text-foreground shadow-sm transition-colors hover:text-primary"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => goTo(1)}
              aria-label="Next image"
              className="absolute top-1/2 right-3 flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-card/90 text-foreground shadow-sm transition-colors hover:text-primary"
            >
              <ChevronRight className="size-4" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
