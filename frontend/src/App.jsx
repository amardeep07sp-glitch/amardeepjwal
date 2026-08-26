import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from '@/features/auth/pages/LoginPage';
import RegisterPage from '@/features/auth/pages/RegisterPage';
import AdminLayout from '@/features/admin/layout/AdminLayout';
import DashboardPage from '@/features/admin/dashboard/DashboardPage';
import ProductsListPage from '@/features/admin/catalog/products/ProductsListPage';
import CategoriesListPage from '@/features/admin/catalog/categories/CategoriesListPage';
import CollectionsListPage from '@/features/admin/catalog/collections/CollectionsListPage';
import CollectionDashboardPage from '@/features/admin/catalog/collections/CollectionDashboardPage';
import BrandsListPage from '@/features/admin/catalog/brands/BrandsListPage';
import AttributeGroupsListPage from '@/features/admin/catalog/attribute-groups/AttributeGroupsListPage';
import AttributesListPage from '@/features/admin/catalog/attributes/AttributesListPage';
import HomepageSectionsListPage from '@/features/admin/cms/homepage/HomepageSectionsListPage';
import NavbarListPage from '@/features/admin/cms/navbar/NavbarListPage';
import FooterColumnsListPage from '@/features/admin/cms/footer/FooterColumnsListPage';
import BannersListPage from '@/features/admin/cms/banners/BannersListPage';
import PagesListPage from '@/features/admin/cms/pages/PagesListPage';
import SettingsPage from '@/features/admin/cms/settings/SettingsPage';
import InventoryDashboardPage from '@/features/admin/inventory/InventoryDashboardPage';
import InventoryListPage from '@/features/admin/inventory/InventoryListPage';
import WarehousesListPage from '@/features/admin/inventory/WarehousesListPage';
import BarcodeManagerPage from '@/features/admin/inventory/BarcodeManagerPage';
import StockAdjustmentsListPage from '@/features/admin/inventory/StockAdjustmentsListPage';
import TransferManagerPage from '@/features/admin/inventory/TransferManagerPage';
import AuditManagerPage from '@/features/admin/inventory/AuditManagerPage';
import AlertsPage from '@/features/admin/inventory/AlertsPage';
import OrderDashboardPage from '@/features/admin/orders/OrderDashboardPage';
import OrdersListPage from '@/features/admin/orders/OrdersListPage';
import OrderDetailPage from '@/features/admin/orders/OrderDetailPage';
import ShipmentManagerPage from '@/features/admin/orders/ShipmentManagerPage';
import ReturnManagerPage from '@/features/admin/orders/ReturnManagerPage';
import RefundManagerPage from '@/features/admin/orders/RefundManagerPage';
import CampaignsListPage from '@/features/admin/campaigns/CampaignsListPage';
import CouponsListPage from '@/features/admin/coupons/CouponsListPage';
import CouponRedemptionsPage from '@/features/admin/coupons/CouponRedemptionsPage';
import InvoicesListPage from '@/features/admin/orders/InvoicesListPage';
import ReviewsListPage from '@/features/admin/reviews/ReviewsListPage';
import MetalRatesPage from '@/features/admin/metalRates/MetalRatesPage';
import CustomerDashboardPage from '@/features/admin/customers/CustomerDashboardPage';
import CustomersListPage from '@/features/admin/customers/CustomersListPage';
import CustomerDetailPage from '@/features/admin/customers/CustomerDetailPage';
import SegmentManagerPage from '@/features/admin/customers/SegmentManagerPage';
import TagManagerPage from '@/features/admin/customers/TagManagerPage';
import PurchaseDashboardPage from '@/features/admin/purchases/PurchaseDashboardPage';
import SuppliersListPage from '@/features/admin/suppliers/SuppliersListPage';
import SupplierDetailPage from '@/features/admin/suppliers/SupplierDetailPage';
import PurchaseOrdersListPage from '@/features/admin/purchases/PurchaseOrdersListPage';
import PurchaseOrderDetailPage from '@/features/admin/purchases/PurchaseOrderDetailPage';
import PurchaseReturnManagerPage from '@/features/admin/purchases/PurchaseReturnManagerPage';
import FinancialDashboardPage from '@/features/admin/accounting/FinancialDashboardPage';
import AccountsListPage from '@/features/admin/accounting/AccountsListPage';
import JournalsListPage from '@/features/admin/accounting/JournalsListPage';
import GeneralLedgerPage from '@/features/admin/accounting/GeneralLedgerPage';
import FinancialReportsPage from '@/features/admin/accounting/FinancialReportsPage';
import ReceivablesPayablesPage from '@/features/admin/accounting/ReceivablesPayablesPage';
import ExpensesListPage from '@/features/admin/accounting/ExpensesListPage';
import ExecutiveDashboardPage from '@/features/admin/reports/ExecutiveDashboardPage';
import ReportsCenterPage from '@/features/admin/reports/ReportsCenterPage';
import CipDashboardPage from '@/features/admin/cip/CipDashboardPage';
import LocationIntelligencePage from '@/features/admin/cip/LocationIntelligencePage';
import CipReportsPage from '@/features/admin/cip/CipReportsPage';
import CipSegmentsPage from '@/features/admin/cip/CipSegmentsPage';
import CipCampaignSpendPage from '@/features/admin/cip/CipCampaignSpendPage';
import BroadcastComposePage from '@/features/admin/broadcast/BroadcastComposePage';
import HelpArticlesListPage from '@/features/admin/help/HelpArticlesListPage';
import HelpCategoriesPage from '@/features/admin/help/HelpCategoriesPage';
import HelpSearchAnalyticsPage from '@/features/admin/help/HelpSearchAnalyticsPage';
import SupportTicketsListPage from '@/features/admin/support/SupportTicketsListPage';
import SupportTicketDetailPage from '@/features/admin/support/SupportTicketDetailPage';
import SupportSettingsPage from '@/features/admin/support/SupportSettingsPage';
import IssuesListPage from '@/features/admin/issues/IssuesListPage';
import FeedbackListPage from '@/features/admin/feedback/FeedbackListPage';
import ProtectedRoute from '@/routes/ProtectedRoute';
import { ScrollToTop } from '@/routes/ScrollToTop';
import NotFoundPage from '@/pages/errors/NotFoundPage';
import { ADMIN_ROLES } from '@/constants/roles';

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route element={<ProtectedRoute allowedRoles={ADMIN_ROLES} />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />

            <Route path="catalog/products" element={<ProductsListPage />} />
            <Route path="catalog/categories" element={<CategoriesListPage />} />
            <Route path="catalog/collections/dashboard" element={<CollectionDashboardPage />} />
            <Route path="catalog/collections" element={<CollectionsListPage />} />
            <Route path="catalog/brands" element={<BrandsListPage />} />
            <Route path="catalog/attribute-groups" element={<AttributeGroupsListPage />} />
            <Route path="catalog/attributes" element={<AttributesListPage />} />

            <Route path="cms/homepage" element={<HomepageSectionsListPage />} />
            <Route path="cms/navbar" element={<NavbarListPage />} />
            <Route path="cms/footer" element={<FooterColumnsListPage />} />
            <Route path="cms/banners" element={<BannersListPage />} />
            <Route path="cms/pages" element={<PagesListPage />} />
            <Route path="cms/settings" element={<SettingsPage />} />

            <Route path="inventory/dashboard" element={<InventoryDashboardPage />} />
            <Route path="inventory" element={<InventoryListPage />} />
            <Route path="inventory/warehouses" element={<WarehousesListPage />} />
            <Route path="inventory/barcodes" element={<BarcodeManagerPage />} />
            <Route path="inventory/adjustments" element={<StockAdjustmentsListPage />} />
            <Route path="inventory/transfers" element={<TransferManagerPage />} />
            <Route path="inventory/audits" element={<AuditManagerPage />} />
            <Route path="inventory/alerts" element={<AlertsPage />} />

            <Route path="orders/dashboard" element={<OrderDashboardPage />} />
            <Route path="orders/shipments" element={<ShipmentManagerPage />} />
            <Route path="orders/returns" element={<ReturnManagerPage />} />
            <Route path="orders/refunds" element={<RefundManagerPage />} />
            <Route path="orders/:id" element={<OrderDetailPage />} />
            <Route path="orders" element={<OrdersListPage />} />
            <Route path="campaigns" element={<CampaignsListPage />} />
            <Route path="coupons" element={<CouponsListPage />} />
            <Route path="coupons/redemptions" element={<CouponRedemptionsPage />} />
            <Route path="invoices" element={<InvoicesListPage />} />
            <Route path="reviews" element={<ReviewsListPage />} />
            <Route path="metal-rates" element={<MetalRatesPage />} />

            <Route path="customers/dashboard" element={<CustomerDashboardPage />} />
            <Route path="customers/segments" element={<SegmentManagerPage />} />
            <Route path="customers/tags" element={<TagManagerPage />} />
            <Route path="customers/:id" element={<CustomerDetailPage />} />
            <Route path="customers" element={<CustomersListPage />} />

            <Route path="purchases/dashboard" element={<PurchaseDashboardPage />} />
            <Route path="suppliers/:id" element={<SupplierDetailPage />} />
            <Route path="suppliers" element={<SuppliersListPage />} />
            <Route path="purchase-orders/:id" element={<PurchaseOrderDetailPage />} />
            <Route path="purchase-orders" element={<PurchaseOrdersListPage />} />
            <Route path="purchase-returns" element={<PurchaseReturnManagerPage />} />

            <Route path="accounting/dashboard" element={<FinancialDashboardPage />} />
            <Route path="accounting/accounts" element={<AccountsListPage />} />
            <Route path="accounting/journals" element={<JournalsListPage />} />
            <Route path="accounting/ledger" element={<GeneralLedgerPage />} />
            <Route path="accounting/reports" element={<FinancialReportsPage />} />
            <Route path="accounting/receivables-payables" element={<ReceivablesPayablesPage />} />
            <Route path="accounting/expenses" element={<ExpensesListPage />} />

            <Route path="reports/executive-dashboard" element={<ExecutiveDashboardPage />} />
            <Route path="reports/center" element={<ReportsCenterPage />} />

            <Route path="cip/dashboard" element={<CipDashboardPage />} />
            <Route path="cip/locations" element={<LocationIntelligencePage />} />
            <Route path="cip/reports" element={<CipReportsPage />} />
            <Route path="cip/segments" element={<CipSegmentsPage />} />
            <Route path="cip/campaign-spend" element={<CipCampaignSpendPage />} />
            <Route path="broadcast" element={<BroadcastComposePage />} />

            <Route path="help/articles" element={<HelpArticlesListPage />} />
            <Route path="help/categories" element={<HelpCategoriesPage />} />
            <Route path="help/search-analytics" element={<HelpSearchAnalyticsPage />} />
            <Route path="support/tickets" element={<SupportTicketsListPage />} />
            <Route path="support/tickets/:id" element={<SupportTicketDetailPage />} />
            <Route path="support/settings" element={<SupportSettingsPage />} />
            <Route path="issues" element={<IssuesListPage />} />
            <Route path="feedback" element={<FeedbackListPage />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  );
}
