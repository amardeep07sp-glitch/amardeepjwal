import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Award, Check, Send, ShieldCheck, Truck, Undo2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNavbarCategories } from '@/features/categories/categoriesApi';
import { usePublicFooterColumns } from '@/features/footer/footerApi';
import { useSubscribeNewsletter } from '@/features/newsletter/newsletterApi';
import { usePublicSettings } from '@/features/settings/settingsApi';
import { categoryPath } from '@/config/navConfig';
import { APP_NAME, APP_SHORT_NAME } from '@/config/appConfig';
import { SmartLink } from '@/components/global/SmartLink';

// A real `path` renders as a link; `path: null` stays plain text - those
// pages (About Us, Shipping/Return policy docs, Size Guide) don't exist
// yet, and this project doesn't ship a dead link or invented company copy
// in their place (same rule navConfig.js's "More" menu follows).
const CUSTOMER_SERVICE_LINKS = [
  { label: 'About Us', path: null },
  { label: 'Help Center', path: '/help' },
  { label: 'Contact Us', path: '/contact' },
  { label: 'FAQs', path: '/faqs' },
  { label: "Today's Gold Rate", path: '/gold-rate' },
  { label: 'Track Order', path: '/track-order' },
  { label: 'Size Guide', path: null },
];

// Real published CMS pages (scripts/seedLegalPages.js seeds a real starting
// draft for each of these by slug - edit the actual wording in Admin -> CMS
// -> Pages, not here) - a separate list from CUSTOMER_SERVICE_LINKS since
// these are legal/policy documents, not support destinations.
const LEGAL_LINKS = [
  { label: 'Privacy Policy', path: '/pages/privacy-policy' },
  { label: 'Terms & Conditions', path: '/pages/terms-conditions' },
  { label: 'Shipping Policy', path: '/pages/shipping-policy' },
  { label: 'Return & Exchange', path: '/pages/return-exchange-policy' },
];

// Only Cash on Delivery actually works right now - online payment
// (Razorpay) is commented out in CheckoutPage.jsx until RAZORPAY_KEY_ID/
// SECRET/WEBHOOK_SECRET are set (see apikey.todo #1). Showing card/UPI
// network badges here while checkout can't actually take them would be a
// straightforwardly false claim - this list must be kept in sync with
// checkout's real payment methods, not just left as evergreen decoration.
const PAYMENT_BADGES = [{ icon: Truck, label: 'Cash on Delivery' }];

// lucide-react deliberately ships no third-party brand/logo icons (a
// trademark, not a completeness, reason) - initials in a plain circle
// stand in for them rather than reaching for someone else's logomark.
// Keyed to Settings.socialLinks' real field names (Admin -> CMS ->
// Settings) - a platform is only ever shown here once a real URL is set
// for it, never as a placeholder/dead link.
const SOCIAL_PLATFORMS = [
  { key: 'instagram', label: 'IG' },
  { key: 'facebook', label: 'FB' },
  { key: 'youtube', label: 'YT' },
  { key: 'twitter', label: 'X' },
  { key: 'pinterest', label: 'PT' },
];

const POLICY_ITEMS = [
  { icon: ShieldCheck, title: 'Secure Payment', description: '100% Secure Checkout' },
  { icon: Award, title: 'Hallmarked Jewellery', description: '100% Certified' },
  { icon: Undo2, title: 'Easy Returns', description: '15 Days Return Policy' },
];

export function Footer() {
  const { data: categories } = useNavbarCategories();
  // Extra admin-managed columns (Admin -> CMS -> Footer) - additive, next
  // to the built-in Shop/Collections/Customer Service columns below, not a
  // replacement for them.
  const { data: extraColumns } = usePublicFooterColumns();
  const { data: settings } = usePublicSettings();
  const activeSocialLinks = SOCIAL_PLATFORMS.map((p) => ({ ...p, url: settings?.socialLinks?.[p.key] })).filter((p) => p.url);
  const [email, setEmail] = useState('');
  const subscribeNewsletter = useSubscribeNewsletter();

  const handleSubscribe = (e) => {
    e.preventDefault();
    subscribeNewsletter.mutate(email, { onSuccess: () => setEmail('') });
  };

  return (
    <footer className="border-t-2 border-primary bg-heading text-background">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-x-6 gap-y-10 px-4 py-12 sm:grid-cols-3 lg:grid-cols-5 lg:px-8">
        <div className="col-span-2 flex flex-col gap-4 sm:col-span-3 lg:col-span-1">
          <Link to="/" className="group flex items-center gap-3 transition-opacity hover:opacity-90">
            <div className="relative flex h-11 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-primary/40 bg-[#2A080C] p-0.5 shadow-md transition-all duration-300 group-hover:border-primary">
              <img
                src="/logo.jpg"
                alt={APP_NAME}
                className="h-full w-auto max-w-[130px] rounded-md object-contain transition-transform duration-300 group-hover:scale-105"
              />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="font-display text-lg font-bold tracking-wide text-background">{APP_SHORT_NAME}</span>
              <span className="text-[10px] font-medium tracking-[0.18em] text-primary uppercase">Swarna Kala Kendra</span>
            </div>
          </Link>
          <p className="max-w-xs text-sm text-background/70">
            {APP_NAME} - jewellery crafted with passion, designed to shine for generations.
          </p>
          {activeSocialLinks.length > 0 && (
            <div className="flex items-center gap-2">
              {activeSocialLinks.map((platform) => (
                <a
                  key={platform.key}
                  href={platform.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={platform.key}
                  className="flex size-8 items-center justify-center rounded-full bg-background/10 text-[10px] font-semibold text-background/70 transition-colors hover:bg-primary hover:text-heading"
                >
                  {platform.label}
                </a>
              ))}
            </div>
          )}
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
          <h3 className="text-xs font-semibold tracking-wide text-background/50 uppercase">Collections & Brands</h3>
          <Link to="/mudrika" className="flex items-center gap-1.5 text-sm font-medium text-[#FCE08B] transition-colors hover:text-white">
            <span className="size-1.5 rounded-full bg-[#D4AF37]" />
            Mudrika (Our Brand)
          </Link>
          <Link to="/new-arrivals" className="text-sm text-background/80 transition-colors hover:text-primary">
            New Arrivals
          </Link>
          <Link to="/offers" className="text-sm text-background/80 transition-colors hover:text-primary">
            Offers
          </Link>
          <Link to="/brands" className="text-sm text-background/80 transition-colors hover:text-primary">
            All Brands
          </Link>
        </div>

        <div className="flex flex-col gap-3">
          <h3 className="text-xs font-semibold tracking-wide text-background/50 uppercase">Customer Service</h3>
          {CUSTOMER_SERVICE_LINKS.map((item) =>
            item.path ? (
              <Link key={item.label} to={item.path} className="text-sm text-background/80 transition-colors hover:text-primary">
                {item.label}
              </Link>
            ) : (
              <span key={item.label} className="text-sm text-background/50">
                {item.label}
              </span>
            )
          )}
        </div>

        <div className="flex flex-col gap-3">
          <h3 className="text-xs font-semibold tracking-wide text-background/50 uppercase">Legal</h3>
          {LEGAL_LINKS.map((item) => (
            <Link key={item.label} to={item.path} className="text-sm text-background/80 transition-colors hover:text-primary">
              {item.label}
            </Link>
          ))}
        </div>

        {(extraColumns ?? []).map((column) => (
          <div key={column._id ?? column.id} className="flex flex-col gap-3">
            <h3 className="text-xs font-semibold tracking-wide text-background/50 uppercase">{column.title}</h3>
            {[...column.links]
              .sort((a, b) => a.order - b.order)
              .map((link) => (
                <SmartLink
                  key={link._id ?? link.id}
                  to={link.url}
                  className="text-sm text-background/80 transition-colors hover:text-primary"
                >
                  {link.label}
                </SmartLink>
              ))}
          </div>
        ))}

        <div className="col-span-2 flex flex-col gap-4 sm:col-span-3 lg:col-span-1">
          <h3 className="text-xs font-semibold tracking-wide text-background/50 uppercase">Newsletter</h3>
          <p className="text-sm text-background/70">Subscribe to get special offers, new arrivals, and exclusive updates.</p>
          {subscribeNewsletter.isSuccess ? (
            <p className="flex items-center gap-2 text-sm font-medium text-primary">
              <Check className="size-4 shrink-0" /> You're subscribed - thanks for joining us!
            </p>
          ) : (
            <form onSubmit={handleSubscribe} className="flex gap-2">
              <Input
                type="email"
                required
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-10 border-background/20 bg-background/5 text-background placeholder:text-background/40"
              />
              <Button type="submit" size="icon" aria-label="Subscribe" className="h-10 shrink-0" loading={subscribeNewsletter.isPending}>
                <Send className="size-4" />
              </Button>
            </form>
          )}
          {subscribeNewsletter.isError && <p className="text-xs text-destructive">{subscribeNewsletter.error.message}</p>}
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
          <p>{settings?.footerCopyrightText || `© ${new Date().getFullYear()} ${APP_NAME}. All Rights Reserved.`}</p>
          <div className="flex items-center gap-2">
            {PAYMENT_BADGES.map((badge) => (
              <span key={badge.label} className="flex items-center gap-1 rounded border border-background/20 px-1.5 py-0.5 text-[10px] font-medium">
                <badge.icon className="size-3" />
                {badge.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
