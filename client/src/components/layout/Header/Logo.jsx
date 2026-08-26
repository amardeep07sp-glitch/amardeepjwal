import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

// Playfair Display is reserved for customer-website branding (per
// src/index.css's own convention) - this is the one place on the
// storefront the brand name gets that font, everywhere else stays Inter.
//
// Deliberately NOT shrink-0 on the root: on a narrow phone header (hamburger
// + logo + account/wishlist/cart icons all in one row) this needs to be
// able to shrink and truncate, or the whole header overflows horizontally.
// Only the icon circle stays a fixed size; the caption line drops below
// `sm` entirely rather than fighting for space it doesn't have.
export function Logo({ className, showText = true }) {
  return (
    <Link
      to="/"
      className={cn('group flex min-w-0 items-center gap-2.5 sm:gap-3 transition-transform active:scale-98', className)}
      aria-label="Amardeep Swarna Kala Kendra - Home"
    >
      <div className="relative flex h-10 sm:h-11.5 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#2A080C] ring-1 ring-[#D4AF37]/40 shadow-xs transition-all duration-300 group-hover:ring-[#D4AF37] group-hover:shadow-md group-hover:shadow-amber-950/15">
        <img
          src="/logo.jpg"
          alt="Amardeep Shitala Prasad"
          className="h-full w-auto max-w-[130px] sm:max-w-[155px] object-contain transition-transform duration-300 group-hover:scale-[1.02]"
        />
      </div>
      {showText && (
        <span className="hidden min-w-0 flex-col leading-none md:flex">
          <span className="truncate font-display text-base font-bold tracking-tight text-[#1E0508] sm:text-lg">
            Amardeep
          </span>
          <span className="truncate text-[9.5px] font-semibold tracking-[0.2em] text-[#9A6B12] uppercase">
            Swarna Kala Kendra
          </span>
        </span>
      )}
    </Link>
  );
}
