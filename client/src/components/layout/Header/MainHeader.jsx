import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, Loader2, LogOut, MapPin, Menu, Package, Search, ShoppingBag, User, X } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { useLogout } from '@/features/auth/authApi';
import { useMyWishlist } from '@/features/storefront/storefrontApi';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useDeliveryLocation } from '@/lib/deliveryLocation';
import { Logo } from './Logo';
import { SearchBar, searchPath } from './SearchBar';
import { CountBadge } from './CountBadge';

// Search is icon-only on mobile everywhere now, expanding into the full
// bar only on tap - a plain local toggle (`isSearchOpen`), not the earlier
// per-route (isBrowsePath) or scroll-driven logic. Simpler on purpose: no
// route classification, no scroll listener, no header-height changes to
// keep in sync with `position: sticky` - the exact class of thing that
// caused real bugs in this header before (see Header.jsx/MainLayout.jsx).
export function MainHeader({ onMenuClick }) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const navigate = useNavigate();
  const cartCount = useCartStore((s) => s.itemCount());
  const { label: deliveryLabel, hasAddress, isDetecting, detectLocation } = useDeliveryLocation();
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();
  const { data: wishlist } = useMyWishlist({ enabled: Boolean(user) });
  const wishlistCount = wishlist?.length ?? 0;

  return (
    <div className="bg-transparent">
      <div className="mx-auto flex max-w-7xl items-center gap-2 px-3 py-3 sm:gap-3 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Open menu"
          className="-ml-1 flex size-9 shrink-0 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted lg:hidden"
        >
          <Menu className="size-5" />
        </button>

        <Logo />

        <SearchBar className="mx-4 hidden max-w-xl flex-1 md:flex" />

        <div className="ml-auto flex shrink-0 items-center gap-0.5 sm:gap-1">
          <button
            type="button"
            onClick={hasAddress ? () => navigate('/addresses') : detectLocation}
            disabled={isDetecting}
            aria-label={hasAddress ? 'Change delivery address' : 'Detect your location'}
            className="cursor-pointer hidden items-center gap-2 rounded-lg px-2.5 py-1.5 text-left transition-colors hover:bg-muted disabled:cursor-wait lg:flex"
          >
            {isDetecting ? <Loader2 className="size-5 animate-spin text-primary" /> : <MapPin className="size-5 text-primary" />}
            <span className="flex flex-col leading-tight">
              <span className="text-[11px] text-muted-foreground">Deliver to</span>
              <span className="max-w-32 truncate text-sm font-medium text-foreground">
                {isDetecting ? 'Detecting...' : (deliveryLabel ?? 'Select location')}
              </span>
            </span>
          </button>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label={`Account menu for ${user.name}`}
                  className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary ring-1 ring-primary/20 transition-colors hover:bg-primary/20 cursor-pointer"
                >
                  {user.name.charAt(0).toUpperCase()}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" sideOffset={10} className="w-64 rounded-2xl border-none p-2 shadow-xl ring-1 ring-primary/15">
                <div className="flex items-center gap-3 rounded-xl bg-primary/5 px-3 py-2.5">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary ring-1 ring-primary/20">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <p className="font-nav truncate text-sm font-medium text-heading">{user.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{user.email || user.phone}</p>
                  </div>
                </div>

                <DropdownMenuSeparator className="my-2" />

                <DropdownMenuItem asChild className="rounded-lg px-2.5 py-2 focus:bg-primary/8">
                  <Link to="/profile" className="font-nav flex items-center gap-2.5 text-[15px] text-foreground">
                    <User className="size-4 text-primary/70" /> My Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="rounded-lg px-2.5 py-2 focus:bg-primary/8">
                  <Link to="/orders" className="font-nav flex items-center gap-2.5 text-[15px] text-foreground">
                    <Package className="size-4 text-primary/70" /> My Orders
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="rounded-lg px-2.5 py-2 focus:bg-primary/8">
                  <Link to="/addresses" className="font-nav flex items-center gap-2.5 text-[15px] text-foreground">
                    <MapPin className="size-4 text-primary/70" /> My Addresses
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuSeparator className="my-2" />

                <DropdownMenuItem
                  disabled={logout.isPending}
                  onSelect={() => logout.mutate()}
                  className="font-nav flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[15px] text-destructive focus:bg-destructive/10 focus:text-destructive"
                >
                  <LogOut className="size-4" />
                  {logout.isPending ? 'Logging out...' : 'Logout'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            // Icon-only, direct link to the auth page - no dropdown, no
            // label. AuthPage.jsx itself defaults to the "Create Account"
            // tab and animates in on mount, so this click already lands
            // the visitor exactly where "Sign in / Register" used to
            // promise, just without spelling it out in the header.
            <Link
              to="/login"
              aria-label="Sign in or create account"
              className="flex size-9 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted"
            >
              <User className="size-5" />
            </Link>
          )}

          {/* Mobile-only (md:hidden - desktop already has the inline bar
              in this same row, further up). Toggles the search row below,
              never navigates away. */}
          <button
            type="button"
            onClick={() => setIsSearchOpen((v) => !v)}
            aria-label={isSearchOpen ? 'Close search' : 'Search'}
            aria-expanded={isSearchOpen}
            className="flex size-9 shrink-0 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted md:hidden"
          >
            {isSearchOpen ? <X className="size-5" /> : <Search className="size-5" />}
          </button>

          <Link
            to="/wishlist"
            aria-label="Wishlist"
            className="relative flex size-9 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted"
          >
            <Heart className="size-5" />
            <CountBadge value={wishlistCount} />
          </Link>

          <Link
            to="/cart"
            aria-label="Cart"
            className="relative flex size-9 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted"
          >
            <ShoppingBag className="size-5" />
            <CountBadge value={cartCount} />
          </Link>
        </div>
      </div>

      {isSearchOpen && (
        <div className="border-t border-border px-4 py-2.5 md:hidden">
          <SearchBar
            autoFocus
            onSubmit={(term) => {
              setIsSearchOpen(false);
              navigate(searchPath(term));
            }}
          />
        </div>
      )}
    </div>
  );
}
