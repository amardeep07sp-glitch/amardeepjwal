import { AccountSidebar } from './AccountSidebar';
import { AccountMobileNav } from './AccountMobileNav';
import { PageContainer } from '@/components/global/PageContainer';
import { BackButton } from '@/components/global/BackButton';
import { Breadcrumb } from '@/components/global/Breadcrumb';

// Shared shell for every "My Account" page (Orders/Profile/Addresses) -
// AccountSidebar only renders at lg+; AccountMobileNav is its horizontal
// pill-row equivalent below that, so every account section stays reachable
// on mobile/tablet instead of only via the browser back button.
export function AccountLayout({ title, subtitle, icon: Icon, breadcrumbLabel, headerExtra, hideMobileNav = false, children }) {
  return (
    <PageContainer top="sm" bottom="md">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <BackButton />
        <Breadcrumb items={[{ label: 'Home', to: '/' }, { label: breadcrumbLabel }]} />
      </div>

      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2.5 text-h3 font-display font-bold text-heading sm:text-h2">
            {Icon && <Icon className="size-6 shrink-0 text-primary sm:size-7" />}
            {title}
          </h1>
          {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        {headerExtra}
      </div>

      {!hideMobileNav && <AccountMobileNav className="mb-5 lg:hidden" />}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[260px_1fr]">
        <AccountSidebar className="hidden lg:flex" />
        <div className="min-w-0">{children}</div>
      </div>
    </PageContainer>
  );
}
