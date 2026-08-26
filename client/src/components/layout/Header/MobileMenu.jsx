import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Award,
  BadgeCheck,
  ChevronRight,
  Coins,
  Grid2x2,
  Heart,
  HelpCircle,
  Layers,
  Loader2,
  LogOut,
  Map,
  MapPin,
  MessageCircle,
  Package,
  Percent,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Truck,
  Undo2,
  User,
} from 'lucide-react';
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { useNavbarCategories } from '@/features/categories/categoriesApi';
import { usePublicNavbarItems } from '@/features/navbar/navbarApi';
import { SmartLink } from '@/components/global/SmartLink';
import { useAuthStore } from '@/store/authStore';
import { useLogout } from '@/features/auth/authApi';
import { DEFAULT_CATEGORIES_FALLBACK, categoryPath } from '@/config/navConfig';
import { useDeliveryLocation } from '@/lib/deliveryLocation';
import { Logo } from './Logo';
import { SearchBar } from './SearchBar';
import { LocationModal } from './LocationModal';

const SHOP_LINKS = [
  { label: 'All Products', path: '/products', icon: Grid2x2 },
  { label: 'New Arrivals', path: '/new-arrivals', badge: 'NEW', icon: Sparkles },
  { label: 'Collections', path: '/collections', icon: Layers },
  { label: 'Brands', path: '/brands', icon: Award },
  { label: 'Offers', path: '/offers', badge: 'HOT', highlight: true, icon: Percent },
];

const SUPPORT_LINKS = [
  { label: "Today's Gold Rate", path: '/gold-rate', icon: Coins },
  { label: 'Track Order', path: '/track-order', icon: Map },
  { label: 'Help Center', path: '/help', icon: HelpCircle },
  { label: 'Contact Us', path: '/contact', icon: MessageCircle },
];

const TRUST_ITEMS = [
  { icon: BadgeCheck, title: '100% Certified', subtitle: 'Hallmark Gold' },
  { icon: Truck, title: 'Free Shipping', subtitle: 'All Orders' },
  { icon: ShieldCheck, title: 'Secure Payment', subtitle: '100% Protected' },
  { icon: Undo2, title: 'Easy Returns', subtitle: '15 Days' },
];

function Row({ to, icon: Icon, label, badge, highlight, onClick }) {
  return (
    <SheetClose asChild>
      <NavLink
        to={to}
        onClick={onClick}
        className="flex items-center gap-3 rounded-xl px-2.5 py-2.5 text-xs sm:text-sm font-medium text-[#2A080C] transition-colors hover:bg-[#FFF9EF] hover:text-[#9A6B12]"
      >
        <Icon className="size-4 shrink-0 text-[#B88A2F]" />
        <span className="min-w-0 flex-1 truncate">{label}</span>
        {badge && (
          <Badge
            className={`h-4.5 shrink-0 px-1.5 text-[9px] font-bold ${
              highlight ? 'bg-[#2A080C] text-[#FCE08B]' : 'bg-[#C8A24D] text-white'
            }`}
          >
            {badge}
          </Badge>
        )}
        <ChevronRight className="size-3.5 shrink-0 text-[#9E9584]" />
      </NavLink>
    </SheetClose>
  );
}

export function MobileMenu({ open, onOpenChange }) {
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const { data: categories } = useNavbarCategories();
  const { data: customItems } = usePublicNavbarItems();
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();
  const { label: deliveryLabel, isDetecting } = useDeliveryLocation();

  const activeCategories = (categories && categories.length > 0) ? categories : DEFAULT_CATEGORIES_FALLBACK;

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="left" className="w-[85%] max-w-sm gap-0 p-0 bg-white border-r border-[#EFE7D8] flex flex-col">
          <SheetHeader className="border-b border-[#EFE7D8] px-4 py-3 bg-[#FAF8F4]">
            <SheetTitle className="sr-only">Mobile Navigation Menu</SheetTitle>
            <div className="flex items-center justify-between">
              <Logo />
            </div>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {/* Search Bar */}
            <SearchBar
              onNavigate={() => onOpenChange(false)}
              className="w-full"
            />

            {/* User Profile / Auth State */}
            {user ? (
              <div className="rounded-2xl border border-[#EFE7D8] bg-[#FFF9EF] p-3">
                <SheetClose asChild>
                  <NavLink
                    to="/profile"
                    className="flex items-center gap-3"
                  >
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#D4AF37]/25 text-sm font-bold text-[#8C6212] ring-1 ring-[#D4AF37]/40">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-[#2A080C]">{user.name}</span>
                      <span className="block text-xs text-[#8C8273]">View Account Profile</span>
                    </div>
                    <ChevronRight className="size-4 shrink-0 text-[#9E9584]" />
                  </NavLink>
                </SheetClose>

                <div className="mt-3 grid grid-cols-2 gap-1.5 border-t border-[#EFE7D8] pt-2.5">
                  <SheetClose asChild>
                    <NavLink
                      to="/orders"
                      className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium text-[#3F3A33] hover:bg-white"
                    >
                      <Package className="size-3.5 text-[#B88A2F]" /> My Orders
                    </NavLink>
                  </SheetClose>
                  <SheetClose asChild>
                    <NavLink
                      to="/addresses"
                      className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium text-[#3F3A33] hover:bg-white"
                    >
                      <MapPin className="size-3.5 text-[#B88A2F]" /> Addresses
                    </NavLink>
                  </SheetClose>
                </div>
              </div>
            ) : (
              <SheetClose asChild>
                <NavLink
                  to="/login"
                  className="flex items-center justify-between rounded-2xl border border-[#EFE7D8] bg-linear-to-r from-[#2A080C] to-[#450D15] p-3 text-white shadow-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex size-9 items-center justify-center rounded-full bg-white/10 text-[#FCE08B]">
                      <User className="size-4.5" />
                    </span>
                    <div>
                      <p className="text-xs font-bold text-[#FCE08B]">Welcome Customer</p>
                      <p className="text-[11px] text-white/80">Sign in for orders & rewards</p>
                    </div>
                  </div>
                  <ChevronRight className="size-4 text-[#FCE08B]" />
                </NavLink>
              </SheetClose>
            )}

            {/* Deliver To Selector Bar */}
            <button
              type="button"
              onClick={() => setIsLocationOpen(true)}
              className="cursor-pointer flex w-full items-center gap-3 rounded-2xl border border-[#EAE0CD] bg-[#FCFAF6] p-3 text-left transition-colors hover:border-[#C8A24D] hover:bg-[#FFF9EF]"
            >
              <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-[#FFF9EF] text-[#B88A2F]">
                {isDetecting ? <Loader2 className="size-4 animate-spin" /> : <MapPin className="size-4" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold text-[#8C8273] uppercase tracking-wider">Deliver to</p>
                <p className="truncate text-xs font-semibold text-[#2A080C]">
                  {isDetecting ? 'Detecting...' : (deliveryLabel ?? 'Select location')}
                </p>
              </div>
              <ChevronRight className="size-4 shrink-0 text-[#9E9584]" />
            </button>

            {/* Featured Mudrika Brand Link */}
            <SheetClose asChild>
              <NavLink
                to="/mudrika"
                className="flex items-center justify-between rounded-2xl bg-linear-to-r from-[#2A080C] via-[#3E0C12] to-[#1A0407] p-3 text-[#FCE08B] border border-[#D4AF37]/50 shadow-xs"
              >
                <div className="flex items-center gap-2.5">
                  <Sparkles className="size-4.5 text-[#FCE08B] animate-pulse" />
                  <div>
                    <p className="text-xs font-bold tracking-wide">MUDRIKA JEWELLERY</p>
                    <p className="text-[10px] text-white/80">Exclusive In-House Brand</p>
                  </div>
                </div>
                <Badge className="bg-[#D4AF37]/30 text-[#FCE08B] border border-[#D4AF37]/40 text-[9px]">
                  FEATURED
                </Badge>
              </NavLink>
            </SheetClose>

            {/* Categories Section */}
            <div className="pt-2">
              <p className="mb-1 px-2 text-[10.5px] font-bold tracking-wider text-[#9A6B12] uppercase">
                Shop By Category
              </p>
              <div className="space-y-0.5">
                {activeCategories.map((cat) => (
                  <Row
                    key={cat.id || cat.slug}
                    to={categoryPath(cat.slug || cat.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'))}
                    icon={Sparkles}
                    label={cat.name}
                  />
                ))}
              </div>
            </div>

            {/* Explore Section */}
            <div className="pt-2 border-t border-[#EFE7D8]">
              <p className="mb-1 px-2 text-[10.5px] font-bold tracking-wider text-[#9A6B12] uppercase">
                Discover
              </p>
              <div className="space-y-0.5">
                {SHOP_LINKS.map((item) => (
                  <Row
                    key={item.path}
                    to={item.path}
                    icon={item.icon}
                    label={item.label}
                    badge={item.badge}
                    highlight={item.highlight}
                  />
                ))}
                {(customItems ?? []).map((item) => (
                  <SheetClose asChild key={item.id}>
                    <SmartLink
                      to={item.path}
                      target={item.openInNewTab ? '_blank' : undefined}
                      className="flex items-center gap-3 rounded-xl px-2.5 py-2.5 text-xs sm:text-sm font-medium text-[#2A080C] transition-colors hover:bg-[#FFF9EF]"
                    >
                      <Sparkles className="size-4 shrink-0 text-[#B88A2F]" />
                      <span className="min-w-0 flex-1 truncate">{item.label}</span>
                      <ChevronRight className="size-3.5 shrink-0 text-[#9E9584]" />
                    </SmartLink>
                  </SheetClose>
                ))}
              </div>
            </div>

            {/* Support & Services */}
            <div className="pt-2 border-t border-[#EFE7D8]">
              <p className="mb-1 px-2 text-[10.5px] font-bold tracking-wider text-[#9A6B12] uppercase">
                Customer Services
              </p>
              <div className="space-y-0.5">
                {SUPPORT_LINKS.map((item) => (
                  <Row key={item.path} to={item.path} icon={item.icon} label={item.label} />
                ))}
              </div>
            </div>

            {/* Logout button if user is logged in */}
            {user && (
              <div className="pt-2 border-t border-[#EFE7D8]">
                <button
                  type="button"
                  disabled={logout.isPending}
                  onClick={() => {
                    logout.mutate();
                    onOpenChange(false);
                  }}
                  className="cursor-pointer flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-xs sm:text-sm font-semibold text-destructive transition-colors hover:bg-destructive/10"
                >
                  <LogOut className="size-4" />
                  <span>{logout.isPending ? 'Logging out...' : 'Sign Out'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Drawer Footer with Wishlist/Cart and Trust Badges */}
          <div className="border-t border-[#EFE7D8] p-4 bg-[#FAF8F4]">
            <div className="mb-3 flex items-center gap-2">
              <SheetClose asChild>
                <NavLink
                  to="/wishlist"
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-[#EAE0CD] bg-white py-2 text-xs font-semibold text-[#2A080C] shadow-2xs transition-colors hover:border-[#C8A24D] hover:bg-[#FFF9EF]"
                >
                  <Heart className="size-3.5 text-[#B88A2F]" /> Wishlist
                </NavLink>
              </SheetClose>
              <SheetClose asChild>
                <NavLink
                  to="/cart"
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-linear-to-r from-[#2A080C] to-[#450D15] py-2 text-xs font-semibold text-[#FCE08B] shadow-xs transition-transform active:scale-98"
                >
                  <ShoppingBag className="size-3.5" /> Cart
                </NavLink>
              </SheetClose>
            </div>

            <div className="grid grid-cols-4 gap-1 border-t border-[#EFE7D8] pt-2.5">
              {TRUST_ITEMS.map((item) => (
                <div key={item.title} className="flex flex-col items-center gap-0.5 text-center">
                  <item.icon className="size-4 text-[#C8A24D]" />
                  <p className="text-[9.5px] leading-tight font-semibold text-[#2A080C]">{item.title}</p>
                  <p className="text-[8.5px] leading-tight text-[#8C8273]">{item.subtitle}</p>
                </div>
              ))}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Location Modal */}
      <LocationModal open={isLocationOpen} onOpenChange={setIsLocationOpen} />
    </>
  );
}
