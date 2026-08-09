import { Link, useLocation } from 'react-router-dom';
import { ADMIN_NAV_ITEMS } from '@/config/adminNav';

export function Breadcrumb() {
  const { pathname } = useLocation();
  const activeItem = ADMIN_NAV_ITEMS.find((item) => pathname.startsWith(item.path));

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm">
      <Link to="/admin/dashboard" className="text-muted-foreground hover:text-foreground">
        Admin
      </Link>
      {activeItem?.group && (
        <>
          <span className="text-muted-foreground">/</span>
          <span className="text-muted-foreground">{activeItem.group}</span>
        </>
      )}
      {activeItem && (
        <>
          <span className="text-muted-foreground">/</span>
          <span className="font-medium text-foreground">{activeItem.label}</span>
        </>
      )}
    </nav>
  );
}
