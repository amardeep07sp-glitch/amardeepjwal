import { Fragment } from 'react';
import { NavLink } from 'react-router-dom';
import { ADMIN_NAV_ITEMS } from '@/config/adminNav';
import { APP_NAME } from '@/config/appConfig';
import { cn } from '@/lib/utils';

export function Sidebar({ onNavigate }) {
  let previousGroup = null;

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 shrink-0 items-center gap-2.5 border-b border-border/60 px-4">
        <div className="flex h-9 shrink-0 items-center justify-center overflow-hidden rounded-md border border-primary/30 bg-[#2A080C] p-0.5 shadow-xs">
          <img
            src="/logo.jpg"
            alt="Amardeep"
            className="h-full w-auto rounded-[4px] object-contain"
          />
        </div>
        <div className="flex min-w-0 flex-col leading-tight">
          <span className="truncate text-xs font-bold text-heading">{APP_NAME}</span>
          <span className="truncate text-[10px] font-medium tracking-wider text-muted-foreground uppercase">Admin Portal</span>
        </div>
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
                      ? 'bg-primary text-primary-foreground shadow-sm font-semibold'
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
