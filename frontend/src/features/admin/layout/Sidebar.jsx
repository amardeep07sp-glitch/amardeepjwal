import { Fragment } from 'react';
import { NavLink } from 'react-router-dom';
import { ADMIN_NAV_ITEMS } from '@/config/adminNav';
import { APP_NAME } from '@/config/appConfig';
import { cn } from '@/lib/utils';

export function Sidebar({ onNavigate }) {
  let previousGroup = null;

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 shrink-0 items-center border-b border-border px-4">
        <span className="truncate text-sm font-semibold text-heading">{APP_NAME}</span>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {ADMIN_NAV_ITEMS.map((item) => {
          const showGroupLabel = item.group && item.group !== previousGroup;
          previousGroup = item.group ?? previousGroup;

          return (
            <Fragment key={item.path}>
              {showGroupLabel && (
                <p className="mt-4 mb-1 px-3 text-caption font-medium tracking-wide text-muted-foreground uppercase first:mt-1">
                  {item.group}
                </p>
              )}
              <NavLink
                to={item.path}
                end
                onClick={onNavigate}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )
                }
              >
                <item.icon className="size-4" />
                {item.label}
              </NavLink>
            </Fragment>
          );
        })}
      </nav>
    </div>
  );
}
