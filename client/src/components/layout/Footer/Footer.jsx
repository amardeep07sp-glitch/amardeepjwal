import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Award,
  BadgeCheck,
  Check,
  Coins,
  CreditCard,
  HelpCircle,
  Lock,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Send,
  ShieldCheck,
  Sparkles,
  Truck,
  Undo2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNavbarCategories } from '@/features/categories/categoriesApi';
import { usePublicFooterColumns } from '@/features/footer/footerApi';
import { useSubscribeNewsletter } from '@/features/newsletter/newsletterApi';
import { usePublicSettings } from '@/features/settings/settingsApi';
import { DEFAULT_CATEGORIES_FALLBACK, categoryPath } from '@/config/navConfig';
import { APP_NAME, APP_SHORT_NAME, SUPPORT_PHONE, SUPPORT_EMAIL, STORE_ADDRESS_FALLBACK } from '@/config/appConfig';
import { SmartLink } from '@/components/global/SmartLink';

const TRUST_PILLARS = [
  {
    icon: Award,
    title: '100% BIS Hallmarked',
    subtitle: 'Pure 916 & 750 Certified Gold with HUID',
  },
  {
    icon: BadgeCheck,
    title: 'Certified Diamonds',
    subtitle: '100% Natural, IGI/GIA Certified Stones',
  },
  {
    icon: Truck,
    title: 'Free & Insured Shipping',
    subtitle: '100% Safe Transit across India',
  },
  {
    icon: Undo2,
    title: '15-Day Easy Returns',
    subtitle: 'Hassle-free Exchange & Return Policy',
  },
];

const CUSTOMER_SERVICE_LINKS = [
  { label: "Today's Gold Rate", path: '/gold-rate', highlight: true },
  { label: 'Track Your Order', path: '/track-order' },
  { label: 'Help Center & Support', path: '/help' },
  { label: 'Contact Us', path: '/contact' },
  { label: 'Book Store Appointment', path: '/contact' },
];

const LEGAL_LINKS = [
  { label: 'Privacy Policy', path: '/pages/privacy-policy' },
  { label: 'Terms & Conditions', path: '/pages/terms-conditions' },
  { label: 'Shipping & Delivery Policy', path: '/pages/shipping-policy' },
  { label: 'Return & Exchange Policy', path: '/pages/return-exchange-policy' },
];

const SOCIAL_PLATFORMS = [
  { key: 'instagram', label: 'Instagram', abbr: 'IG' },
  { key: 'facebook', label: 'Facebook', abbr: 'FB' },
  { key: 'youtube', label: 'YouTube', abbr: 'YT' },
  { key: 'whatsapp', label: 'WhatsApp', abbr: 'WA' },
  { key: 'twitter', label: 'X', abbr: 'X' },
];

const PAYMENT_METHODS = [
  'UPI / QR Code',
  'Visa',
  'Mastercard',
  'RuPay',
  'Net Banking',
  'Cash on Delivery',
];

export function Footer() {
  const { data: categories, isLoading: categoriesLoading } = useNavbarCategories();
  const { data: extraColumns } = usePublicFooterColumns();
  const { data: settings } = usePublicSettings();
  const [email, setEmail] = useState('');
  const subscribeNewsletter = useSubscribeNewsletter();

  // The loading-state placeholder only covers the brief window before the
  // real list resolves - once it has (even to a genuinely empty array), that
  // real result wins rather than showing 8 made-up categories forever (see
  // CategoryNav.jsx's identical navCategories for the full reasoning).
  const activeCategories = categoriesLoading ? DEFAULT_CATEGORIES_FALLBACK : (categories ?? []);
  const activeSocialLinks = SOCIAL_PLATFORMS.map((p) => ({ ...p, url: settings?.socialLinks?.[p.key] })).filter((p) => p.url);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    subscribeNewsletter.mutate(email, { onSuccess: () => setEmail('') });
  };

  return (
    <footer className="relative border-t-2 border-[#C8A24D]/60 bg-linear-to-b from-[#1A0508] via-[#120306] to-[#0A0103] text-[#E8DFD1]">
      {/* Tier 1: Trust & Assurance Ribbon */}
      <div className="border-b border-[#D4AF37]/15 bg-[#120306]/70">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-6 py-8 sm:grid-cols-2 lg:grid-cols-4 lg:px-8">
          {TRUST_PILLARS.map((item) => (
            <div key={item.title} className="flex items-center gap-3.5 group">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-[#D4AF37]/25 to-[#B8860B]/10 text-[#FCE08B] border border-[#D4AF37]/30 shadow-xs transition-transform duration-300 group-hover:scale-110">
                <item.icon className="size-5.5" />
              </span>
              <div className="min-w-0">
                <p className="font-serif text-sm font-semibold text-[#FDF9F0] tracking-wide">{item.title}</p>
                <p className="text-xs text-[#A89E8D] leading-snug">{item.subtitle}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tier 2: VIP Newsletter & Club Banner */}
      <div className="border-b border-[#D4AF37]/15 bg-linear-to-r from-[#22070B] via-[#2D0A0F] to-[#1C0508]">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-6 py-10 lg:flex-row lg:px-8">
          <div className="max-w-xl text-center lg:text-left">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold tracking-[0.25em] text-[#FCE08B] uppercase">
              <Sparkles className="size-3.5" /> Amardeep Privé Circle
            </span>
            <h3 className="mt-1 font-serif text-xl sm:text-2xl font-bold text-white tracking-wide">
              Join Our Exclusive Jewellery Newsletter
            </h3>
            <p className="mt-1 text-xs sm:text-sm text-[#BDB2A2]">
              Be the first to receive festive collection previews, today&apos;s gold rate updates, and exclusive VIP invitations.
            </p>
          </div>

          <div className="w-full max-w-md">
            {subscribeNewsletter.isSuccess ? (
              <div className="flex items-center justify-center gap-2 rounded-2xl border border-[#D4AF37]/40 bg-[#D4AF37]/10 p-3.5 text-sm font-semibold text-[#FCE08B]">
                <Check className="size-4.5" /> Thank you for joining our exclusive circle!
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="relative flex items-center">
                <Input
                  type="email"
                  required
                  placeholder="Enter your email address..."
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 w-full rounded-full border border-[#D4AF37]/35 bg-[#140306]/90 pr-28 pl-4.5 text-xs sm:text-sm text-white placeholder:text-[#8C806F] focus:border-[#FCE08B] focus:ring-2 focus:ring-[#D4AF37]/30 shadow-inner"
                />
                <Button
                  type="submit"
                  disabled={subscribeNewsletter.isPending}
                  className="absolute right-1.5 h-9 rounded-full bg-linear-to-r from-[#D4AF37] to-[#B8860B] px-4.5 text-xs font-bold text-[#1A0508] shadow-md transition-all hover:scale-102 hover:from-[#FCE08B] hover:to-[#D4AF37]"
                >
                  {subscribeNewsletter.isPending ? 'Sending...' : 'Subscribe'}
                  <Send className="size-3.5 ml-1" />
                </Button>
              </form>
            )}
            {subscribeNewsletter.isError && (
              <p className="mt-1.5 text-center text-xs font-medium text-destructive lg:text-left">
                {subscribeNewsletter.error.message}
              </p>
            )}
            <p className="mt-2 text-center text-[11px] text-[#8C806F] lg:text-left">
              🔒 We respect your privacy. Unsubscribe at any time.
            </p>
          </div>
        </div>
      </div>

      {/* Tier 3: Main Directory Columns */}
      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-12">
          {/* Column 1: Brand & Heritage (4 cols) */}
          <div className="space-y-4 lg:col-span-4">
            <Link to="/" className="group flex items-center gap-3 w-fit">
              <div className="relative flex h-11.5 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#D4AF37]/50 bg-[#2A080C] p-1 shadow-md transition-all duration-300 group-hover:border-[#D4AF37] group-hover:scale-102">
                <img
                  src="/logo.jpg"
                  alt={APP_NAME}
                  className="h-full w-auto max-w-[140px] rounded-lg object-contain"
                />
              </div>
              <div className="flex flex-col leading-none">
                <span className="font-serif text-lg font-bold tracking-tight text-white">{APP_SHORT_NAME}</span>
                <span className="text-[9.5px] font-bold tracking-[0.22em] text-[#FCE08B] uppercase">
                  Swarna Kala Kendra
                </span>
              </div>
            </Link>

            <p className="text-xs sm:text-[13px] leading-relaxed text-[#B8ADA0] max-w-sm">
              Handcrafting timeless gold, diamond, and polki heirlooms since 1998. Every creation celebrates royal Indian heritage, pure BIS 916 hallmarking, and lifelong trust.
            </p>

            {/* Showroom & Contact Details - real settings-driven data (Admin
                -> Settings), falling back to the real store locality/support
                line/inbox rather than an invented placeholder. */}
            <div className="space-y-2 pt-1 text-xs text-[#C7BCAD]">
              <div className="flex items-start gap-2.5">
                <MapPin className="size-4 shrink-0 text-[#D4AF37] mt-0.5" />
                <span>Showroom: {settings?.address || STORE_ADDRESS_FALLBACK}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="size-4 shrink-0 text-[#D4AF37]" />
                <a href={`tel:${(settings?.contactPhone || SUPPORT_PHONE).replace(/\s+/g, '')}`} className="hover:text-[#FCE08B]">
                  Customer Care: {settings?.contactPhone || SUPPORT_PHONE}
                </a>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="size-4 shrink-0 text-[#D4AF37]" />
                <a href={`mailto:${settings?.contactEmail || SUPPORT_EMAIL}`} className="hover:text-[#FCE08B]">
                  Email: {settings?.contactEmail || SUPPORT_EMAIL}
                </a>
              </div>
            </div>

            {/* Social Channels */}
            {activeSocialLinks.length > 0 && (
              <div className="pt-2">
                <p className="text-[11px] font-bold tracking-wider text-[#D4AF37] uppercase mb-2">Connect With Us</p>
                <div className="flex items-center gap-2">
                  {activeSocialLinks.map((platform) => (
                    <a
                      key={platform.key}
                      href={platform.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={platform.label}
                      className="flex size-8.5 items-center justify-center rounded-xl border border-[#D4AF37]/30 bg-[#25070B] text-xs font-bold text-[#FCE08B] transition-all hover:scale-110 hover:border-[#D4AF37] hover:bg-[#D4AF37] hover:text-[#1A0508]"
                    >
                      {platform.abbr}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Column 2: Our Collections & Categories (3 cols) */}
          <div className="space-y-3 lg:col-span-3">
            <p className="font-serif text-sm font-bold tracking-wider text-[#FCE08B] uppercase">
              Jewellery Collections
            </p>
            <ul className="space-y-2 text-xs sm:text-[13px]">
              <li>
                <Link
                  to="/mudrika"
                  className="inline-flex items-center gap-1.5 font-semibold text-[#FCE08B] transition-all hover:text-white hover:translate-x-1"
                >
                  <Sparkles className="size-3 text-[#D4AF37] animate-pulse" />
                  MUDRIKA (In-House Brand)
                </Link>
              </li>
              <li>
                <Link to="/products" className="text-[#C7BCAD] transition-all hover:text-[#FCE08B] hover:translate-x-1 inline-block">
                  All Jewellery Catalogue
                </Link>
              </li>
              <li>
                <Link to="/new-arrivals" className="text-[#C7BCAD] transition-all hover:text-[#FCE08B] hover:translate-x-1 inline-block">
                  New Arrivals
                </Link>
              </li>
              <li>
                <Link to="/offers" className="text-[#C7BCAD] transition-all hover:text-[#FCE08B] hover:translate-x-1 inline-block">
                  Festive Offers & Deals
                </Link>
              </li>
              {activeCategories.slice(0, 6).map((cat) => (
                <li key={cat.id || cat.slug}>
                  <Link
                    to={categoryPath(cat.slug || cat.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'))}
                    className="text-[#C7BCAD] transition-all hover:text-[#FCE08B] hover:translate-x-1 inline-block"
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Customer Care & Services (2.5 cols) */}
          <div className="space-y-3 lg:col-span-3">
            <p className="font-serif text-sm font-bold tracking-wider text-[#FCE08B] uppercase">
              Customer Services
            </p>
            <ul className="space-y-2 text-xs sm:text-[13px]">
              {CUSTOMER_SERVICE_LINKS.map((item) => (
                <li key={item.label}>
                  <Link
                    to={item.path}
                    className={`transition-all hover:translate-x-1 inline-block ${
                      item.highlight
                        ? 'font-semibold text-[#FCE08B] hover:text-white'
                        : 'text-[#C7BCAD] hover:text-[#FCE08B]'
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Legal & Policies (2.5 cols) */}
          <div className="space-y-3 lg:col-span-2">
            <p className="font-serif text-sm font-bold tracking-wider text-[#FCE08B] uppercase">
              Policies & Legal
            </p>
            <ul className="space-y-2 text-xs sm:text-[13px]">
              {LEGAL_LINKS.map((item) => (
                <li key={item.label}>
                  <Link
                    to={item.path}
                    className="text-[#C7BCAD] transition-all hover:text-[#FCE08B] hover:translate-x-1 inline-block"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Admin Extra Columns (if configured) */}
          {(extraColumns ?? []).map((column) => (
            <div key={column._id ?? column.id} className="space-y-3 lg:col-span-2">
              <p className="font-serif text-sm font-bold tracking-wider text-[#FCE08B] uppercase">
                {column.title}
              </p>
              <ul className="space-y-2 text-xs sm:text-[13px]">
                {[...column.links]
                  .sort((a, b) => a.order - b.order)
                  .map((link) => (
                    <li key={link._id ?? link.id}>
                      <SmartLink
                        to={link.url}
                        className="text-[#C7BCAD] transition-all hover:text-[#FCE08B] hover:translate-x-1 inline-block"
                      >
                        {link.label}
                      </SmartLink>
                    </li>
                  ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Tier 4: Payment Badges & Copyright Footer Bar */}
      <div className="border-t border-[#D4AF37]/20 bg-[#0A0103]">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-5 text-xs text-[#8C806F] sm:flex-row lg:px-8">
          <p className="text-center sm:text-left">
            {settings?.footerCopyrightText || `© ${new Date().getFullYear()} ${APP_NAME}. All Rights Reserved. Handcrafted in India.`}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="flex items-center gap-1 text-[11px] text-[#A89E8D] mr-1">
              <Lock className="size-3.5 text-[#D4AF37]" /> 100% Safe Payments:
            </span>
            {PAYMENT_METHODS.map((method) => (
              <span
                key={method}
                className="rounded-lg border border-[#D4AF37]/25 bg-[#180407] px-2.5 py-1 text-[10.5px] font-medium text-[#D1C7B7]"
              >
                {method}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
