import { Link } from 'react-router-dom';
import { Heart, LogOut, MapPin, Menu, Package, ShoppingBag, User } from 'lucide-react';
import { useStorefrontStore } from '@/store/storefrontStore';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { useLogout } from '@/features/auth/authApi';
import { useMyWishlist } from '@/features/storefront/storefrontApi';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { DEFAULT_DELIVERY_LOCATION } from '@/config/appConfig';
import { Logo } from './Logo';
import { SearchBar } from './SearchBar';
import { CountBadge } from './CountBadge';

export function MainHeader({ onMenuClick }) {
  const cartCount = useCartStore((s) => s.itemCount());
  const deliveryLocation = useStorefrontStore((s) => s.deliveryLocation);
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();
  const { data: wishlist } = useMyWishlist({ enabled: Boolean(user) });
  const wishlistCount = wishlist?.length ?? 0;

  return (
    <div className="bg-background">
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
            className="cursor-pointer hidden items-center gap-2 rounded-lg px-2.5 py-1.5 text-left transition-colors hover:bg-muted lg:flex"
          >
            <MapPin className="size-5 text-primary" />
            <span className="flex flex-col leading-tight">
              <span className="text-[11px] text-muted-foreground">Deliver to</span>
              <span className="max-w-28 truncate text-sm font-medium text-foreground">
                {deliveryLocation ?? DEFAULT_DELIVERY_LOCATION}
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
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel className="truncate font-normal text-muted-foreground">{user.email || user.phone}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/profile" className="flex items-center gap-2">
                    <User className="size-4" /> My Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/orders" className="flex items-center gap-2">
                    <Package className="size-4" /> My Orders
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/addresses" className="flex items-center gap-2">
                    <MapPin className="size-4" /> My Addresses
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  disabled={logout.isPending}
                  onSelect={() => logout.mutate()}
                  className="flex items-center gap-2 text-destructive focus:text-destructive"
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

      <div className="border-t border-border px-4 py-2.5 md:hidden">
        <SearchBar />
      </div>
    </div>
  );
}
