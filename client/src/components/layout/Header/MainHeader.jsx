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
import { LocationModal } from './LocationModal';

export function MainHeader({ onMenuClick }) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const navigate = useNavigate();
  const cartCount = useCartStore((s) => s.itemCount());
  const { label: deliveryLabel, isDetecting } = useDeliveryLocation();
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();
  const { data: wishlist } = useMyWishlist({ enabled: Boolean(user) });
  const wishlistCount = wishlist?.length ?? 0;

  return (
    <div className="bg-transparent">
      <div className="mx-auto flex max-w-7xl items-center gap-2 px-3 py-2.5 sm:gap-4 sm:px-6 lg:px-8">
        {/* Mobile Hamburger Button */}
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Open menu"
          className="cursor-pointer -ml-1 flex size-9 shrink-0 items-center justify-center rounded-full text-[#2B1B0E] transition-colors hover:bg-[#FAF6EE] lg:hidden"
        >
          <Menu className="size-5" />
        </button>

        {/* Brand Logo */}
        <Logo />

        {/* Desktop Search Bar */}
        <SearchBar className="mx-4 hidden max-w-xl flex-1 md:flex" />

        {/* Action Controls (Deliver to, Profile, Wishlist, Cart) */}
        <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-1.5">
          {/* Deliver To Selector Button */}
          <button
            type="button"
            onClick={() => setIsLocationOpen(true)}
            aria-label="Change delivery location"
            className="cursor-pointer hidden items-center gap-2 rounded-xl border border-transparent px-2.5 py-1 text-left transition-all duration-200 hover:border-[#EAE0CD] hover:bg-[#FFF9EF] lg:flex"
          >
            <div className="flex size-7.5 items-center justify-center rounded-lg bg-[#FFF9EF] text-[#B88A2F]">
              {isDetecting ? <Loader2 className="size-4 animate-spin" /> : <MapPin className="size-4" />}
            </div>
            <span className="flex flex-col leading-tight">
              <span className="text-[10.5px] font-semibold text-[#8C8273]">Deliver to</span>
              <span className="max-w-28 xl:max-w-36 truncate text-xs font-semibold text-[#2A080C]">
                {isDetecting ? 'Detecting...' : (deliveryLabel ?? 'Select Location')}
              </span>
            </span>
          </button>

          {/* User Account / Profile */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label={`Account menu for ${user.name}`}
                  className="cursor-pointer flex size-9 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-[#D4AF37]/20 to-[#B8860B]/10 text-xs sm:text-sm font-bold text-[#8C6212] ring-1 ring-[#D4AF37]/40 transition-all hover:ring-[#D4AF37] hover:scale-105"
                >
                  {user.name.charAt(0).toUpperCase()}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" sideOffset={10} className="w-64 rounded-2xl border border-[#EFE7D8] bg-white p-2 shadow-xl">
                <div className="flex items-center gap-3 rounded-xl bg-[#FFF9EF] px-3 py-2.5">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#D4AF37]/20 text-sm font-bold text-[#8C6212] ring-1 ring-[#D4AF37]/40">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[#2A080C]">{user.name}</p>
                    <p className="truncate text-xs text-[#8C8273]">{user.email || user.phone}</p>
                  </div>
                </div>

                <DropdownMenuSeparator className="my-1.5 bg-[#EFE7D8]" />

                <DropdownMenuItem asChild className="rounded-lg px-2.5 py-2 cursor-pointer focus:bg-[#FFF9EF]">
                  <Link to="/profile" className="flex items-center gap-2.5 text-xs sm:text-sm text-[#3E3A33]">
                    <User className="size-4 text-[#B88A2F]" /> My Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="rounded-lg px-2.5 py-2 cursor-pointer focus:bg-[#FFF9EF]">
                  <Link to="/orders" className="flex items-center gap-2.5 text-xs sm:text-sm text-[#3E3A33]">
                    <Package className="size-4 text-[#B88A2F]" /> My Orders
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="rounded-lg px-2.5 py-2 cursor-pointer focus:bg-[#FFF9EF]">
                  <Link to="/wishlist" className="flex items-center gap-2.5 text-xs sm:text-sm text-[#3E3A33]">
                    <Heart className="size-4 text-[#B88A2F]" /> My Wishlist
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="rounded-lg px-2.5 py-2 cursor-pointer focus:bg-[#FFF9EF]">
                  <Link to="/addresses" className="flex items-center gap-2.5 text-xs sm:text-sm text-[#3E3A33]">
                    <MapPin className="size-4 text-[#B88A2F]" /> My Addresses
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuSeparator className="my-1.5 bg-[#EFE7D8]" />

                <DropdownMenuItem
                  disabled={logout.isPending}
                  onSelect={() => logout.mutate()}
                  className="cursor-pointer flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs sm:text-sm text-destructive focus:bg-destructive/10 focus:text-destructive"
                >
                  <LogOut className="size-4" />
                  {logout.isPending ? 'Logging out...' : 'Logout'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link
              to="/login"
              aria-label="Sign in or create account"
              className="group flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold text-[#2A080C] transition-all hover:bg-[#FFF9EF] hover:text-[#9A6B12]"
            >
              <span className="flex size-8 items-center justify-center rounded-full bg-[#FCFAF6] border border-[#E6DCC5] group-hover:border-[#C8A24D] group-hover:bg-white text-[#8C6212] transition-colors">
                <User className="size-4" />
              </span>
              <span className="hidden sm:inline">Sign In</span>
            </Link>
          )}

          {/* Mobile Search Toggle Icon */}
          <button
            type="button"
            onClick={() => setIsSearchOpen((v) => !v)}
            aria-label={isSearchOpen ? 'Close search' : 'Search'}
            aria-expanded={isSearchOpen}
            className="cursor-pointer flex size-9 shrink-0 items-center justify-center rounded-full text-[#2B1B0E] transition-colors hover:bg-[#FAF6EE] md:hidden"
          >
            {isSearchOpen ? <X className="size-5 text-[#9A6B12]" /> : <Search className="size-5" />}
          </button>

          {/* Wishlist Link */}
          <Link
            to="/wishlist"
            aria-label="Wishlist"
            className="relative flex size-9 items-center justify-center rounded-full text-[#2B1B0E] transition-colors hover:bg-[#FAF6EE] hover:text-[#9A6B12]"
          >
            <Heart className="size-5" />
            <CountBadge value={wishlistCount} />
          </Link>

          {/* Cart Link */}
          <Link
            to="/cart"
            aria-label="Shopping Cart"
            className="relative flex size-9 items-center justify-center rounded-full text-[#2B1B0E] transition-colors hover:bg-[#FAF6EE] hover:text-[#9A6B12]"
          >
            <ShoppingBag className="size-5" />
            <CountBadge value={cartCount} />
          </Link>
        </div>
      </div>

      {/* Mobile Search Bar Expandable Drawer */}
      {isSearchOpen && (
        <div className="border-t border-[#EFE7D8] bg-[#FAF8F4] px-4 py-2.5 shadow-md md:hidden animate-in slide-in-from-top-2 duration-200">
          <SearchBar
            autoFocus
            onNavigate={() => setIsSearchOpen(false)}
            onSubmit={(term) => {
              setIsSearchOpen(false);
              navigate(searchPath(term));
            }}
          />
        </div>
      )}

      {/* Location Modal */}
      <LocationModal open={isLocationOpen} onOpenChange={setIsLocationOpen} />
    </div>
  );
}
