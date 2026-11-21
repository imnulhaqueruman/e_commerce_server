import { Suspense, lazy } from 'react';
import { Route, Routes } from 'react-router-dom';
import { Navbar } from '@/app/layout/Navbar';
import { Footer } from '@/app/layout/Footer';
import ProtectedRoute from '@/app/routes/ProtectedRoute';
import AdminRoute from '@/app/routes/AdminRoute';
import { LoadingState } from '@/shared/ui';
import Home from '@/features/catalog/pages/Home';
import Shop from '@/features/catalog/pages/Shop';
import ProductDetail from '@/features/catalog/pages/ProductDetail';
import Category from '@/features/catalog/pages/Category';
import SubCategory from '@/features/catalog/pages/SubCategory';
import Search from '@/features/catalog/pages/Search';
import Login from '@/features/auth/pages/Login';
import Register from '@/features/auth/pages/Register';
import Cart from '@/features/cart/pages/Cart';
import Checkout from '@/features/cart/pages/Checkout';
import OrderSuccess from '@/features/cart/pages/OrderSuccess';
import Account from '@/features/account/pages/Account';
import NotFound from '@/app/pages/NotFound';

// The admin bundle is split out — most visitors never open it.
const AdminDashboard = lazy(() => import('@/features/admin/pages/Dashboard'));
const AdminProducts = lazy(() => import('@/features/admin/pages/Products'));
const AdminCategories = lazy(() => import('@/features/admin/pages/Categories'));
const AdminSubs = lazy(() => import('@/features/admin/pages/Subs'));
const AdminCoupons = lazy(() => import('@/features/admin/pages/Coupons'));
const AdminOrders = lazy(() => import('@/features/admin/pages/Orders'));

function AdminFallback() {
  return (
    <div className="section">
      <LoadingState rows={4} />
    </div>
  );
}

export default function AppRoutes() {
  return (
    <div className="flex min-h-screen flex-col">
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <Navbar />

      <main id="main" className="flex-1">
        <Suspense fallback={<AdminFallback />}>
          <Routes>
            {/* Storefront */}
            <Route path="/" element={<Home />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/search" element={<Search />} />
            <Route path="/category/:slug" element={<Category />} />
            <Route path="/sub/:slug" element={<SubCategory />} />
            <Route path="/product/:slug" element={<ProductDetail />} />

            {/* Auth */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Signed-in */}
            <Route element={<ProtectedRoute />}>
              <Route path="/user" element={<Account />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/order/success" element={<OrderSuccess />} />
            </Route>

            {/* Admin */}
            <Route element={<AdminRoute />}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/products" element={<AdminProducts />} />
              <Route path="/admin/categories" element={<AdminCategories />} />
              <Route path="/admin/subs" element={<AdminSubs />} />
              <Route path="/admin/coupons" element={<AdminCoupons />} />
              <Route path="/admin/orders" element={<AdminOrders />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>

      <Footer />
    </div>
  );
}
