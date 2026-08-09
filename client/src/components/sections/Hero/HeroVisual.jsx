import { motion } from 'framer-motion';
import { Gem, Sparkles } from 'lucide-react';

// Fills its parent completely (the hero slide uses it as a full-bleed
// background, with a scrim + text overlaid on top - see HeroBanner.jsx).
// Renders a real banner image (Admin -> CMS -> Banners) once one exists;
// falls back to an abstract, animated gold motif rather than a broken
// <img> when it doesn't.
export function HeroVisual({ image }) {
  if (image) {
    // object-bottom, not center - a wide hero box cropping a less-wide
    // upload tends to cut off the top of the frame, not the bottom, for
    // most "dramatic" jewellery/product photography (subject weighted
    // toward the lower half). Not a substitute for a real focal-point
    // control, but a much better default than a center crop.
    return <img src={image.secureUrl} alt={image.altText || ''} className="size-full object-cover object-bottom" />;
  }

  return (
    <div className="relative flex size-full items-center justify-center bg-secondary">
      <motion.div
        className="absolute inset-0 bg-linear-to-br from-primary/20 via-secondary to-secondary"
        animate={{ opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="relative flex size-40 items-center justify-center rounded-full bg-card/80 shadow-lg ring-1 ring-primary/20 sm:size-52"
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      >
        <Gem className="size-16 text-primary sm:size-20" strokeWidth={1.25} />
      </motion.div>

      <motion.span
        className="absolute top-[20%] left-[15%] flex size-9 items-center justify-center rounded-full bg-card/80 text-primary shadow-md ring-1 ring-primary/20"
        animate={{ y: [0, -12, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      >
        <Sparkles className="size-4" />
      </motion.span>
      <motion.span
        className="absolute right-[18%] bottom-[22%] flex size-9 items-center justify-center rounded-full bg-card/80 text-primary shadow-md ring-1 ring-primary/20"
        animate={{ y: [0, -12, 0] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
      >
        <Sparkles className="size-4" />
      </motion.span>
    </div>
  );
}
