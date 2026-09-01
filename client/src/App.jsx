import { Navigate, Route, Routes } from 'react-router-dom';
import { ScrollToTop } from '@/routes/ScrollToTop';
import { PageViewTracker } from '@/routes/PageViewTracker';
import { ApplyTypography } from '@/components/global/ApplyTypography';
import { MainLayout } from '@/components/layout/MainLayout';
import { AuthLayout } from '@/components/layout/AuthLayout';
import HomePage from '@/pages/HomePage';
import ProductDetailPage from '@/pages/ProductDetailPage';
import ProductListingPage from '@/pages/ProductListingPage';
import AllCategoriesPage from '@/pages/AllCategoriesPage';
import CollectionsPage from '@/pages/CollectionsPage';
import CollectionDetailPage from '@/pages/CollectionDetailPage';
import BrandsPage from '@/pages/BrandsPage';
import BrandDetailPage from '@/pages/BrandDetailPage';
import MudrikaPage from '@/pages/MudrikaPage';
import AuthPage from '@/pages/AuthPage';
import ForgotPasswordPage from '@/pages/ForgotPasswordPage';
import ResetPasswordPage from '@/pages/ResetPasswordPage';
import CartPage from '@/pages/CartPage';
import CheckoutPage from '@/pages/CheckoutPage';
import OrderConfirmationPage from '@/pages/OrderConfirmationPage';
import MyOrdersPage from '@/pages/MyOrdersPage';
import OrderDetailPage from '@/pages/OrderDetailPage';
import WishlistPage from '@/pages/WishlistPage';
import ProfilePage from '@/pages/ProfilePage';
import RewardsPage from '@/pages/RewardsPage';
import TrackOrderPage from '@/pages/TrackOrderPage';
import GoldRatePage from '@/pages/GoldRatePage';
import ContactPage from '@/pages/ContactPage';
import AddressesPage from '@/pages/AddressesPage';
import HelpCenterPage from '@/pages/HelpCenterPage';
import HelpArticlePage from '@/pages/HelpArticlePage';
import HelpCategoryPage from '@/pages/HelpCategoryPage';
import SupportCenterPage from '@/pages/SupportCenterPage';
import SupportTicketDetailPage from '@/pages/SupportTicketDetailPage';
import CmsPage from '@/pages/CmsPage';

export default function App() {
  return (
    <>
      <ScrollToTop />
      <PageViewTracker />
      <ApplyTypography />
      <Routes>
        <Route element={<MainLayout />}>
          <Route index element={<HomePage />} />
          {/* No fixed sortBy here (unlike New Arrivals/Offers below, which
              are intentionally always-newest) - "featured" is already
              ProductListingPage's own default when nothing is chosen, so
              passing it as a FIXED sortBy was silently locking the sort
              dropdown to Featured no matter what a visitor picked. */}
          <Route path="products" element={<ProductListingPage title="All Products" />} />
          <Route path="products/:slug" element={<ProductDetailPage />} />
          <Route path="new-arrivals" element={<ProductListingPage title="New Arrivals" sortBy="newest" />} />
          <Route path="offers" element={<ProductListingPage title="Offers" sortBy="newest" onSale />} />
          <Route path="category/:slug" element={<ProductListingPage />} />
          <Route path="categories" element={<AllCategoriesPage />} />
          <Route path="collections" element={<CollectionsPage />} />
          <Route path="collections/:slug" element={<CollectionDetailPage />} />
          <Route path="brands" element={<BrandsPage />} />
          <Route path="brand/:slug" element={<BrandDetailPage />} />
          <Route path="mudrika" element={<MudrikaPage />} />
          <Route path="brand/mudrika" element={<MudrikaPage />} />
          {/* No fixed sortBy (unlike New Arrivals/Offers) - relevance is
              only the right default sort for a search result page, not the
              only one; the visitor can still switch to price high/low
              like any other listing. */}
          <Route path="search" element={<ProductListingPage title="Search" />} />
          <Route path="cart" element={<CartPage />} />
          <Route path="checkout" element={<CheckoutPage />} />
          <Route path="order-confirmation/:orderId" element={<OrderConfirmationPage />} />
          <Route path="orders" element={<MyOrdersPage />} />
          <Route path="orders/:orderId" element={<OrderDetailPage />} />
          <Route path="wishlist" element={<WishlistPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="rewards" element={<RewardsPage />} />
          <Route path="track-order" element={<TrackOrderPage />} />
          <Route path="gold-rate" element={<GoldRatePage />} />
          <Route path="contact" element={<ContactPage />} />
          {/* /faqs was a static, hardcoded page (not admin-editable) that the
              real, CMS-driven Help Center (/help - HelpCenterPage.jsx) was
              already meant to replace (see that file's own header comment) -
              this redirect finishes that migration instead of leaving both
              live side by side as two different "answers to questions" UIs. */}
          <Route path="faqs" element={<Navigate to="/help" replace />} />
          <Route path="pages/:slug" element={<CmsPage />} />
          <Route path="addresses" element={<AddressesPage />} />
          <Route path="help" element={<HelpCenterPage />} />
          <Route path="help/category/:category" element={<HelpCategoryPage />} />
          <Route path="help/:slug" element={<HelpArticlePage />} />
          <Route path="support" element={<SupportCenterPage />} />
          <Route path="support/tickets/:id" element={<SupportTicketDetailPage />} />
          <Route path="*" element={<HomePage />} />
        </Route>

        <Route element={<AuthLayout />}>
          <Route path="login" element={<AuthPage />} />
          <Route path="forgot-password" element={<ForgotPasswordPage />} />
          <Route path="reset-password" element={<ResetPasswordPage />} />
        </Route>
      </Routes>
    </>
  );
}
