import { Routes, Route } from 'react-router-dom';
import Home from '@/pages/Home';
import Shop from '@/pages/Shop';
import ProductDetail from '@/pages/ProductDetail';
import Search from '@/pages/Search';
import Category from '@/pages/Category';
import SubCategory from '@/pages/SubCategory';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import UserDashboard from '@/pages/UserDashboard';
import Orders from '@/pages/Orders';
import Cart from '@/pages/Cart';
import Checkout from '@/pages/Checkout';
import OrderSuccess from '@/pages/OrderSuccess';
import AdminDashboard from '@/pages/admin/AdminDashboard';
import AdminProducts from '@/pages/admin/AdminProducts';
import AdminCategories from '@/pages/admin/AdminCategories';
import AdminSubs from '@/pages/admin/AdminSubs';
import AdminCoupons from '@/pages/admin/AdminCoupons';
import AdminOrders from '@/pages/admin/AdminOrders';
import ProtectedRoute from './ProtectedRoute';
import AdminRoute from './AdminRoute';
import NotFound from '@/pages/NotFound';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';

export default function AppRoutes() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/search" element={<Search />} />
          <Route path="/category/:slug" element={<Category />} />
          <Route path="/sub/:slug" element={<SubCategory />} />
          <Route path="/product/:slug" element={<ProductDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/user" element={<UserDashboard />} />
            <Route path="/user/orders" element={<Orders />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/order/success" element={<OrderSuccess />} />
          </Route>

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
      </main>
      <Footer />
    </div>
  );
}