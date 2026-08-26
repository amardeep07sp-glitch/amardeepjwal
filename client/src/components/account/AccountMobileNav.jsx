import { NavLink } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useLogout } from '@/features/auth/authApi';
import { useMyWishlist } from '@/features/storefront/storefrontApi';
import { cn } from '@/lib/utils';
import { ACCOUNT_NAV_ITEMS } from './AccountSidebar';

// AccountSidebar only ever rendered at lg+ - below that, every account page
// (Orders/Wishlist/Rewards/Addresses/Support/Profile) had literally no way
// to reach any other account section except the browser back button. Same
// horizontal scrollable pill-row pattern ProductListingPage's mobile
// filter chips use, driven by the same ACCOUNT_NAV_ITEMS as the sidebar.
export function AccountMobileNav({ className }) {
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();
  const { data: wishlist } = useMyWishlist({ enabled: Boolean(user) });
  const counts = { wishlist: wishlist?.length ?? 0 };

  if (!user) return null;

  return (
    <nav className={cn('scrollbar-none flex items-center gap-2 overflow-x-auto pb-1', className)}>
      {ACCOUNT_NAV_ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            cn(
              'flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium ring-1 transition-colors',
              isActive ? 'bg-primary/10 text-primary ring-primary/20' : 'bg-card text-foreground ring-border hover:bg-muted'
            )
          }
        >
          <item.icon className="size-4" />
          {item.label}
          {item.countKey && counts[item.countKey] > 0 && (
            <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-xs font-semibold text-primary">{counts[item.countKey]}</span>
          )}
        </NavLink>
      ))}
      <button
        type="button"
        disabled={logout.isPending}
        onClick={() => logout.mutate()}
        className="flex shrink-0 items-center gap-1.5 rounded-full bg-card px-3.5 py-2 text-sm font-medium text-destructive ring-1 ring-border hover:bg-destructive/10"
      >
        <LogOut className="size-4" />
        {logout.isPending ? 'Logging out...' : 'Logout'}
      </button>
    </nav>
  );
}
