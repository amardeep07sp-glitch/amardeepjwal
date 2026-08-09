import { Link } from 'react-router-dom';
import { Gem } from 'lucide-react';
import { cn } from '@/lib/utils';
import { APP_SHORT_NAME } from '@/config/appConfig';

// Playfair Display is reserved for customer-website branding (per
// src/index.css's own convention) - this is the one place on the
// storefront the brand name gets that font, everywhere else stays Inter.
//
// Deliberately NOT shrink-0 on the root: on a narrow phone header (hamburger
// + logo + account/wishlist/cart icons all in one row) this needs to be
// able to shrink and truncate, or the whole header overflows horizontally.
// Only the icon circle stays a fixed size; the caption line drops below
// `sm` entirely rather than fighting for space it doesn't have.
export function Logo({ className }) {
  return (
    <Link
      to="/"
      className={cn('flex min-w-0 items-center gap-2 sm:gap-2.5', className)}
      aria-label="Amardeep Swarna Kala Kendra - Home"
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary ring-1 ring-primary/30 sm:size-10">
        <Gem className="size-4.5 sm:size-5" />
      </span>
      <span className="flex min-w-0 flex-col leading-none">
        <span className="truncate font-display text-lg font-bold tracking-wide text-heading sm:text-xl">
          {APP_SHORT_NAME}
        </span>
        <span className="hidden truncate text-[10px] font-medium tracking-[0.2em] text-muted-foreground uppercase sm:block">
          Swarna Kala Kendra
        </span>
      </span>
    </Link>
  );
}
