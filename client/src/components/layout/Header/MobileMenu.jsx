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
import { categoryPath } from '@/config/navConfig';
import { useDeliveryLocation } from '@/lib/deliveryLocation';
import { Logo } from './Logo';
import { SearchBar } from './SearchBar';

const SHOP_LINKS = [
  { label: 'All Products', path: '/products', icon: Grid2x2 },
  { label: 'Mudrika', path: '/mudrika', badge: 'OUR BRAND', highlight: true, icon: Sparkles },
  { label: 'New Arrivals', path: '/new-arrivals', badge: 'NEW', icon: Sparkles },
  { label: 'Collections', path: '/collections', icon: Layers },
  { label: 'Brands', path: '/brands', icon: Award },
  { label: 'Offers', path: '/offers', badge: 'HOT', highlight: true, icon: Percent },
];

const SUPPORT_LINKS = [
  { label: 'Help Center', path: '/help', icon: HelpCircle },
  { label: 'Track Order', path: '/track-order', icon: Map },
  { label: "Today's Gold Rate", path: '/gold-rate', icon: Coins },
];

const TRUST_ITEMS = [
  { icon: BadgeCheck, title: '100% Certified', subtitle: 'Jewellery' },
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
        className="flex items-center gap-3 rounded-xl px-2 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
      >
        <Icon className="size-4.5 shrink-0 text-primary" />
        <span className="min-w-0 flex-1 truncate">{label}</span>
        {badge && (
          <Badge variant={highlight ? 'destructive' : 'default'} className="h-4.5 shrink-0 px-1.5 text-[9px]">
            {badge}
          </Badge>
        )}
        <ChevronRight className="size-4 shrink-0 text-muted-foreground/60" />
      </NavLink>
    </SheetClose>
  );
}

// One flat, chevron-navigable list throughout - no nested accordions/mega
// menus (that's CategoryNav.jsx's job on desktop, where there's room for
// it). A drawer this narrow reads better as a single scrollable list of
// real destinations than as several expand/collapse groups.
export function MobileMenu({ open, onOpenChange }) {
  const { data: categories } = useNavbarCategories();
  const { data: customItems } = usePublicNavbarItems();
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const { label: deliveryLabel, hasAddress, isDetecting, detectLocation } = useDeliveryLocation();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-[85%] gap-0 p-0 sm:max-w-sm">
        <SheetHeader className="border-b border-border">
          <SheetTitle className="sr-only">Menu</SheetTitle>
          <Logo />
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-4">
          <SearchBar className="mb-4" />

          {user ? (
            <>
              <SheetClose asChild>
                <NavLink
                  to="/profile"
                  className="mb-1 flex items-center gap-3 rounded-xl bg-primary/5 px-2.5 py-2.5 transition-colors hover:bg-primary/10"
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary ring-1 ring-primary/20">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-heading">{user.name}</span>
                    <span className="block text-xs text-muted-foreground">View Profile</span>
                  </span>
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground/60" />
                </NavLink>
              </SheetClose>
              <Row to="/orders" icon={Package} label="My Orders" />
              <Row to="/addresses" icon={MapPin} label="My Addresses" />
            </>
          ) : (
            <Row to="/login" icon={User} label="Sign in / Register" />
          )}
          <Row to="/contact" icon={MessageCircle} label="Contact Us" />

          <button
            type="button"
            disabled={isDetecting}
            onClick={() => {
              if (hasAddress) {
                navigate('/addresses');
                onOpenChange(false);
              } else {
                detectLocation();
              }
            }}
            className="my-3 flex w-full items-center gap-3 rounded-xl bg-secondary/50 px-3 py-3 text-left disabled:cursor-wait"
          >
            {isDetecting ? (
              <Loader2 className="size-4.5 shrink-0 animate-spin text-primary" />
            ) : (
              <MapPin className="size-4.5 shrink-0 text-primary" />
            )}
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-primary">Deliver to</p>
              <p className="truncate text-sm text-foreground">{isDetecting ? 'Detecting...' : (deliveryLabel ?? 'Select location')}</p>
            </div>
            <ChevronRight className="size-4 shrink-0 text-muted-foreground/60" />
          </button>

          <p className="mb-1 mt-2 px-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">Shop</p>
          {SHOP_LINKS.map((item) => (
            <Row key={item.path} to={item.path} icon={item.icon} label={item.label} badge={item.badge} highlight={item.highlight} />
          ))}
          {(customItems ?? []).map((item) => (
            <SheetClose asChild key={item.id}>
              <SmartLink
                to={item.path}
                target={item.openInNewTab ? '_blank' : undefined}
                className="flex items-center gap-3 rounded-xl px-2 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                <Sparkles className="size-4.5 shrink-0 text-primary" />
                <span className="min-w-0 flex-1 truncate">{item.label}</span>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground/60" />
              </SmartLink>
            </SheetClose>
          ))}

          {categories?.length > 0 && (
            <>
              <p className="mb-1 mt-3 px-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">Categories</p>
              {categories.map((cat) => (
                <Row key={cat.id} to={categoryPath(cat.slug)} icon={Sparkles} label={cat.name} />
              ))}
            </>
          )}

          <p className="mb-1 mt-3 px-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">Support</p>
          {SUPPORT_LINKS.map((item) => (
            <Row key={item.path} to={item.path} icon={item.icon} label={item.label} />
          ))}
        </div>

        <div className="border-t border-border p-4">
          <div className="mb-4 flex items-center gap-2">
            <SheetClose asChild>
              <NavLink
                to="/wishlist"
                className="flex flex-1 items-center justify-center gap-2 rounded-button border border-border py-2.5 text-sm font-medium transition-colors hover:bg-muted"
              >
                <Heart className="size-4" /> Wishlist
              </NavLink>
            </SheetClose>
            <SheetClose asChild>
              <NavLink
                to="/cart"
                className="flex flex-1 items-center justify-center gap-2 rounded-button bg-primary py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
              >
                <ShoppingBag className="size-4" /> Cart
              </NavLink>
            </SheetClose>
          </div>

          <div className="grid grid-cols-4 gap-1 border-t border-border pt-3">
            {TRUST_ITEMS.map((item) => (
              <div key={item.title} className="flex flex-col items-center gap-1 text-center">
                <item.icon className="size-4.5 text-primary" />
                <p className="text-[10px] leading-tight font-semibold text-foreground">{item.title}</p>
                <p className="text-[9px] leading-tight text-muted-foreground">{item.subtitle}</p>
              </div>
            ))}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
