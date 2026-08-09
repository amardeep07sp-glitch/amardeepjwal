import { NavLink } from 'react-router-dom';
import { Heart, LogOut, MapPin, Package, User } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useLogout } from '@/features/auth/authApi';
import { useMyWishlist } from '@/features/storefront/storefrontApi';
import { cn } from '@/lib/utils';

// Only real destinations - My Dashboard/Notifications/Offers/Returns/Help
// (shown in the reference mockups) each need their own backend feature
// that doesn't exist yet (a notification feed, a public offers browser, a
// customer-facing returns flow, a support desk) - listing them here would
// be a dead link, not a shortcut. Add an entry only once its page exists,
// same rule the admin sidebar (adminNav.js) already follows.
const NAV_ITEMS = [
  { label: 'My Orders', to: '/orders', icon: Package },
  { label: 'Wishlist', to: '/wishlist', icon: Heart, countKey: 'wishlist' },
  { label: 'My Addresses', to: '/addresses', icon: MapPin },
  { label: 'My Profile', to: '/profile', icon: User },
];

export function AccountSidebar({ className }) {
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();
  const { data: wishlist } = useMyWishlist({ enabled: Boolean(user) });
  const counts = { wishlist: wishlist?.length ?? 0 };

  if (!user) return null;

  return (
    <aside className={cn('flex flex-col gap-4', className)}>
      <div className="flex items-center gap-3 rounded-2xl bg-card p-4 ring-1 ring-border">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-base font-semibold text-primary ring-1 ring-primary/20">
          {user.name.charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-heading">{user.name}</p>
          <p className="truncate text-xs text-muted-foreground">{user.email || user.phone}</p>
        </div>
      </div>

      <nav className="flex flex-col gap-1 rounded-2xl bg-card p-2 ring-1 ring-border">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                isActive ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-muted'
              )
            }
          >
            <span className="flex items-center gap-2.5">
              <item.icon className="size-4.5" />
              {item.label}
            </span>
            {item.countKey && counts[item.countKey] > 0 && (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">{counts[item.countKey]}</span>
            )}
          </NavLink>
        ))}

        <button
          type="button"
          disabled={logout.isPending}
          onClick={() => logout.mutate()}
          className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-destructive transition-colors hover:bg-destructive/10 cursor-pointer"
        >
          <LogOut className="size-4.5" />
          {logout.isPending ? 'Logging out...' : 'Logout'}
        </button>
      </nav>
    </aside>
  );
}
