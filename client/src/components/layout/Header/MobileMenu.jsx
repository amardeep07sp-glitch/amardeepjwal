import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, Heart, LogOut, MapPin, MessageCircle, Package, ShoppingBag, User } from 'lucide-react';
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useNavbarCategories } from '@/features/categories/categoriesApi';
import { useAuthStore } from '@/store/authStore';
import { useLogout } from '@/features/auth/authApi';
import { NAV_EXTRA_AFTER, NAV_EXTRA_BEFORE, categoryPath } from '@/config/navConfig';
import { DEFAULT_DELIVERY_LOCATION } from '@/config/appConfig';
import { Logo } from './Logo';
import { SearchBar } from './SearchBar';

// A live category (with children) becomes an expandable group; a leaf
// category is just a plain link - same shape CategoryNav.jsx's mega menu
// uses (type 'category' + flat `links`), so both surfaces stay driven by
// the exact same API payload.
function buildNavItems(categories) {
  return categories.map((category) => ({
    label: category.name,
    path: categoryPath(category.slug),
    megaMenu: category.children?.length
      ? {
          type: 'category',
          heading: `Shop ${category.name}`,
          ctaLabel: `View All ${category.name}`,
          ctaPath: categoryPath(category.slug),
          links: category.children.map((c) => ({
            label: c.name,
            path: categoryPath(c.slug),
            productCount: c.productCountRecursive ?? c.productCount ?? 0,
          })),
        }
      : null,
  }));
}

export function MobileMenu({ open, onOpenChange }) {
  const { data: categories } = useNavbarCategories();
  const navItems = [...NAV_EXTRA_BEFORE, ...buildNavItems(categories ?? []), ...NAV_EXTRA_AFTER];
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();

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
              <div className="mb-1 flex items-center justify-between gap-2 rounded-lg px-2 py-2.5">
                <SheetClose asChild>
                  <NavLink to="/profile" className="flex min-w-0 items-center gap-3">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary ring-1 ring-primary/20">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                    <span className="truncate text-sm font-medium text-foreground">{user.name}</span>
                  </NavLink>
                </SheetClose>
                <button
                  type="button"
                  disabled={logout.isPending}
                  onClick={() => logout.mutate()}
                  aria-label="Logout"
                  className="flex size-8 shrink-0 items-center justify-center rounded-full text-destructive transition-colors hover:bg-destructive/10"
                >
                  <LogOut className="size-4" />
                </button>
              </div>
              <SheetClose asChild>
                <NavLink to="/orders" className="flex items-center gap-3 rounded-lg px-2 py-2.5 text-sm font-medium text-foreground hover:bg-muted">
                  <Package className="size-4.5 text-primary" />
                  My Orders
                </NavLink>
              </SheetClose>
              <SheetClose asChild>
                <NavLink to="/addresses" className="flex items-center gap-3 rounded-lg px-2 py-2.5 text-sm font-medium text-foreground hover:bg-muted">
                  <MapPin className="size-4.5 text-primary" />
                  My Addresses
                </NavLink>
              </SheetClose>
            </>
          ) : (
            <SheetClose asChild>
              <NavLink
                to="/login"
                className="flex items-center gap-3 rounded-lg px-2 py-2.5 text-sm font-medium text-foreground hover:bg-muted"
              >
                <User className="size-4.5 text-primary" />
                Sign in / Register
              </NavLink>
            </SheetClose>
          )}
          <SheetClose asChild>
            <NavLink
              to="/contact"
              className="flex items-center gap-3 rounded-lg px-2 py-2.5 text-sm font-medium text-foreground hover:bg-muted"
            >
              <MessageCircle className="size-4.5 text-primary" />
              Contact Us
            </NavLink>
          </SheetClose>
          <button
            type="button"
            className="flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-left text-sm font-medium text-foreground hover:bg-muted"
          >
            <MapPin className="size-4.5 text-primary" />
            Deliver to - {DEFAULT_DELIVERY_LOCATION}
          </button>

          <Separator className="my-3" />

          <p className="mb-1 px-2 text-caption font-semibold tracking-wide text-muted-foreground uppercase">
            Shop by Category
          </p>
          <div className="mb-3 grid grid-cols-2 gap-1">
            {(categories ?? []).map((cat) => (
              <SheetClose asChild key={cat.id}>
                <NavLink to={categoryPath(cat.slug)} className="font-nav rounded-lg px-2 py-2 text-sm font-light text-foreground hover:bg-muted">
                  {cat.name}
                </NavLink>
              </SheetClose>
            ))}
          </div>

          <Separator className="my-3" />

          <nav className="flex flex-col">
            {navItems.map((item) =>
              item.megaMenu ? (
                <MobileNavGroup key={item.path} item={item} />
              ) : (
                <SheetClose asChild key={item.path}>
                  <NavLink
                    to={item.path}
                    className="font-nav flex items-center gap-2 rounded-lg px-2 py-2.5 text-sm font-light text-foreground hover:bg-muted"
                  >
                    {item.icon && <item.icon className="size-4 text-primary" />}
                    {item.label}
                    {item.badge && (
                      <Badge variant={item.highlight ? 'destructive' : 'default'} className="h-4 px-1.5 text-[9px]">
                        {item.badge}
                      </Badge>
                    )}
                  </NavLink>
                </SheetClose>
              )
            )}
          </nav>
        </div>

        <div className="flex items-center gap-2 border-t border-border p-4">
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
      </SheetContent>
    </Sheet>
  );
}

function MobileNavGroup({ item }) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="font-nav flex w-full items-center justify-between rounded-lg px-2 py-2.5 text-sm font-light text-foreground hover:bg-muted"
      >
        <span className="flex items-center gap-2">
          {item.icon && <item.icon className="size-4 text-primary" />}
          {item.label}
          {item.badge && (
            <Badge variant={item.highlight ? 'destructive' : 'default'} className="h-4 px-1.5 text-[9px]">
              {item.badge}
            </Badge>
          )}
        </span>
        <ChevronDown className={cn('size-4 text-muted-foreground transition-transform duration-200', open && 'rotate-180')} />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden pl-4"
          >
            {item.megaMenu.type === 'category' ? (
              <div className="py-1.5">
                <p className="px-2 py-1 text-xs font-semibold text-muted-foreground">{item.megaMenu.heading}</p>
                {item.megaMenu.links.map((link) => (
                  <SheetClose asChild key={link.path}>
                    <NavLink
                      to={link.path}
                      className="flex items-center justify-between gap-2 rounded-lg px-2 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                      {link.label}
                      {link.productCount > 0 && <span className="text-xs text-muted-foreground/70">{link.productCount}</span>}
                    </NavLink>
                  </SheetClose>
                ))}
                <SheetClose asChild>
                  <NavLink
                    to={item.megaMenu.ctaPath}
                    className="mt-1 block rounded-lg px-2 py-2 text-sm font-semibold text-primary hover:bg-muted"
                  >
                    {item.megaMenu.ctaLabel}
                  </NavLink>
                </SheetClose>
              </div>
            ) : (
              item.megaMenu.columns.map((col) => (
                <div key={col.heading} className="py-1.5">
                  <p className="px-2 py-1 text-xs font-semibold text-muted-foreground">{col.heading}</p>
                  {col.links.map((link) => (
                    <SheetClose asChild key={link.path}>
                      <NavLink
                        to={link.path}
                        className="block rounded-lg px-2 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                      >
                        {link.label}
                      </NavLink>
                    </SheetClose>
                  ))}
                </div>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
