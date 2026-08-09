import { Link } from 'react-router-dom';
import { Gem, Send, ShieldCheck, Undo2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNavbarCategories } from '@/features/categories/categoriesApi';
import { categoryPath } from '@/config/navConfig';
import { APP_NAME, APP_SHORT_NAME } from '@/config/appConfig';

// Static content-page links (About/Contact/FAQs/legal) render as plain
// text, not <Link>s - those pages don't exist yet, and a footer full of
// dead links pointing at "/" would be worse than being upfront that
// they're coming. Shop/Collections links, by contrast, are all real.
const CUSTOMER_SERVICE_LINKS = ['About Us', 'Contact Us', 'FAQs', 'Shipping Policy', 'Return & Exchange', 'Size Guide'];

const PAYMENT_BADGES = ['VISA', 'Mastercard', 'RuPay', 'UPI', 'AMEX'];

// lucide-react deliberately ships no third-party brand/logo icons (a
// trademark, not a completeness, reason) - initials in a plain circle
// stand in for them rather than reaching for someone else's logomark.
const SOCIAL_LINKS = ['IG', 'FB', 'YT'];

const POLICY_ITEMS = [
  { icon: ShieldCheck, title: 'Secure Payment', description: '100% Secure Checkout' },
  { icon: Gem, title: 'Hallmarked Jewellery', description: '100% Certified' },
  { icon: Undo2, title: 'Easy Returns', description: '15 Days Return Policy' },
];

export function Footer() {
  const { data: categories } = useNavbarCategories();

  return (
    <footer className="border-t-2 border-primary bg-heading text-background">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-x-6 gap-y-10 px-4 py-12 sm:grid-cols-3 lg:grid-cols-5 lg:px-8">
        <div className="col-span-2 flex flex-col gap-4 sm:col-span-3 lg:col-span-1">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
              <Gem className="size-4.5" />
            </span>
            <span className="font-display text-lg font-bold text-background">{APP_SHORT_NAME}</span>
          </Link>
          <p className="max-w-xs text-sm text-background/70">
            {APP_NAME} - jewellery crafted with passion, designed to shine for generations.
          </p>
          {/* Decorative for now - link these once real social profiles exist. */}
          <div className="flex items-center gap-2">
            {SOCIAL_LINKS.map((label) => (
              <span
                key={label}
                className="flex size-8 items-center justify-center rounded-full bg-background/10 text-[10px] font-semibold text-background/70"
              >
                {label}
              </span>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <h3 className="text-xs font-semibold tracking-wide text-background/50 uppercase">Shop</h3>
          <Link to="/products" className="text-sm text-background/80 transition-colors hover:text-primary">
            All Jewellery
          </Link>
          {(categories ?? []).map((cat) => (
            <Link key={cat.id} to={categoryPath(cat.slug)} className="text-sm text-background/80 transition-colors hover:text-primary">
              {cat.name}
            </Link>
          ))}
        </div>

        <div className="flex flex-col gap-3">
          <h3 className="text-xs font-semibold tracking-wide text-background/50 uppercase">Collections</h3>
          <Link to="/new-arrivals" className="text-sm text-background/80 transition-colors hover:text-primary">
            New Arrivals
          </Link>
          <Link to="/offers" className="text-sm text-background/80 transition-colors hover:text-primary">
            Offers
          </Link>
        </div>

        <div className="flex flex-col gap-3">
          <h3 className="text-xs font-semibold tracking-wide text-background/50 uppercase">Customer Service</h3>
          {CUSTOMER_SERVICE_LINKS.map((label) => (
            <span key={label} className="text-sm text-background/50">
              {label}
            </span>
          ))}
        </div>

        <div className="col-span-2 flex flex-col gap-4 sm:col-span-3 lg:col-span-1">
          <h3 className="text-xs font-semibold tracking-wide text-background/50 uppercase">Newsletter</h3>
          <p className="text-sm text-background/70">Subscribe to get special offers, new arrivals, and exclusive updates.</p>
          <form
            onSubmit={(e) => e.preventDefault()}
            className="flex gap-2"
          >
            <Input
              type="email"
              required
              placeholder="Enter your email"
              className="h-10 border-background/20 bg-background/5 text-background placeholder:text-background/40"
            />
            <Button type="submit" size="icon" aria-label="Subscribe" className="h-10 shrink-0">
              <Send className="size-4" />
            </Button>
          </form>
          <p className="text-xs text-background/40">We respect your privacy.</p>
        </div>
      </div>

      <div className="border-t border-background/10">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-4 px-4 py-6 sm:grid-cols-3 lg:px-8">
          {POLICY_ITEMS.map((item) => (
            <div key={item.title} className="flex items-center gap-3">
              <item.icon className="size-5 shrink-0 text-primary" />
              <div>
                <p className="text-sm font-medium text-background">{item.title}</p>
                <p className="text-xs text-background/60">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-background/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-4 text-xs text-background/50 sm:flex-row lg:px-8">
          <p>
            © {new Date().getFullYear()} {APP_NAME}. All Rights Reserved.
          </p>
          <div className="flex items-center gap-2">
            {PAYMENT_BADGES.map((label) => (
              <span key={label} className="rounded border border-background/20 px-1.5 py-0.5 text-[10px] font-medium">
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
