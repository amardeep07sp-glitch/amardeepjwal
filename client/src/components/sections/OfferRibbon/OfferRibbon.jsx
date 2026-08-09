import { BadgePercent, Gift, Sparkles } from 'lucide-react';

// Static for now, same reasoning as data/heroSlides.js: this is the shape a
// future CMS-driven "current offers" endpoint would return, so wiring that
// up later only touches this array, not the markup. A slim promotional
// ticker sits above the hero on most premium jewellery sites (Tanishq
// included) - distinct from TrustBadges below, which are evergreen policy
// badges (returns/shipping/certification), not time-bound offers.
const OFFERS = [
  { icon: Sparkles, label: 'BIS Hallmarked 916 Gold on Every Piece' },
  { icon: BadgePercent, label: 'Extra 5% Off on Prepaid Orders' },
  { icon: Gift, label: 'Free Insured Shipping, Pan-India' },
];

export function OfferRibbon() {
  return (
    <section className="mx-auto w-full min-w-0 max-w-7xl px-4 pt-3 sm:pt-4 lg:px-8">
      <div className="scrollbar-none flex items-center gap-6 overflow-x-auto rounded-full bg-linear-to-r from-heading via-[#2A2418] to-heading px-5 py-2.5 shadow-[0_10px_25px_-10px_rgba(17,24,39,0.5)] sm:justify-center sm:gap-8">
        {OFFERS.map((offer) => (
          <span
            key={offer.label}
            className="flex shrink-0 items-center gap-2 text-xs font-medium tracking-wide whitespace-nowrap text-white/90 sm:text-[13px]"
          >
            <offer.icon className="size-3.5 shrink-0 text-primary" />
            {offer.label}
          </span>
        ))}
      </div>
    </section>
  );
}
