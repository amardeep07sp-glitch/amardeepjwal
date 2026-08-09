// Static for now - the same shape a future CMS-driven `/homepage/hero`
// endpoint (Phase: Storefront CMS) would return, so swapping to a fetch
// later only touches HeroBanner's data source, not its markup.
//
// CTA paths only ever point at routes that actually exist (/products,
// /new-arrivals, /offers, /category/:slug) - no "Wedding Collection" or
// "Find a Store" style page that isn't a real route.
export const HERO_SLIDES = [
  {
    eyebrow: 'Crafted to Perfection',
    heading: 'Timeless Beauty, Made for You',
    description: 'Exquisite designs that celebrate every moment of your life.',
    primaryCta: { label: 'Shop All Products', path: '/products' },
    secondaryCta: { label: 'Explore New Arrivals', path: '/new-arrivals' },
  },
  {
    eyebrow: 'Certified Hallmark Gold',
    heading: 'Heirlooms in the Making',
    description: 'Every piece is BIS hallmarked and backed by a lifetime exchange promise.',
    primaryCta: { label: 'Shop Now', path: '/products' },
    secondaryCta: { label: 'View Offers', path: '/offers' },
  },
  {
    eyebrow: 'The Wedding Edit',
    heading: 'Say Yes to Forever',
    description: 'Bridal sets, statement necklaces and rings, curated for your big day.',
    primaryCta: { label: 'Shop New Arrivals', path: '/new-arrivals' },
    secondaryCta: { label: 'Shop All Products', path: '/products' },
  },
];
