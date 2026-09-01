import { AccountSidebar } from './AccountSidebar';
import { PageContainer } from '@/components/global/PageContainer';
import { BackButton } from '@/components/global/BackButton';
import { Breadcrumb } from '@/components/global/Breadcrumb';

// Shared shell for every "My Account" page (Orders/Profile/Addresses) -
// AccountSidebar only renders at lg+. Below that, the hamburger MobileMenu's
// own account quick-links (My Orders/Rewards/Addresses/Support, plus
// Profile and Wishlist elsewhere in that same drawer) are the way to reach
// another account section - this layout used to repeat that same pill row
// again on every account page, which was pure duplicate navigation chrome
// stacked between the breadcrumb and the page title.
export function AccountLayout({ title, subtitle, icon: Icon, breadcrumbLabel, headerExtra, children }) {
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

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[260px_1fr]">
        <AccountSidebar className="hidden lg:flex" />
        <div className="min-w-0">{children}</div>
      </div>
    </PageContainer>
  );
}
