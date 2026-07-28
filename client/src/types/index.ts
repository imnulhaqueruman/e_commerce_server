export interface User {
  _id?: string;
  email: string;
  name?: string;
  role?: 'admin' | 'subscribe' | string;
  address?: string;
  picture?: string;
}

export interface Category {
  _id: string;
  name: string;
  slug: string;
  createdAt?: string;
}

export interface Sub {
  _id: string;
  name: string;
  slug: string;
  parent: string | Category;
}

export interface Product {
  _id: string;
  title: string;
  slug: string;
  description: string;
  price: number | string;
  category: Category | string;
  subs?: Sub[] | string[];
  quantity?: number;
  sold?: number;
  images?: string[];
  color?: string;
  brand?: string;
  shipping?: 'Yes' | 'No' | string;
  ratings?: { star: number; postedBy: string }[];
}

export interface CartItem {
  product: Product | string;
  count: number;
  color: string;
  price: number;
  _id?: string;
}

export interface AppliedCoupon {
  _id: string;
  name: string;
  discount: number;
  expiry: string;
}

export interface Cart {
  products: CartItem[];
  cartTotal: number;
  totalAfterDiscount?: number;
  couponApplied?: AppliedCoupon;
}

export interface Order {
  _id: string;
  products: CartItem[];
  paymentIntent?: any;
  orderStatus: string;
  orderedBy: string;
  createdAt?: string;
  updatedAt?: string;
  cartTotal?: number;
}

export interface Coupon {
  _id: string;
  name: string;
  expiry: string;
  discount: number;
}

export interface WishlistResponse {
  wishlist: Product[];
}

export interface AdminStatsRange {
  from: string;
  to: string;
}

export interface AdminStats {
  ordersCount: number;
  productCount: number;
  couponCount: number;
  revenue: number;
  byStatus?: Record<string, number>;
  revenueSeries?: { date: string; total: number; count: number }[];
  windowDays?: number;
  range?: AdminStatsRange | null;
  bucket?: 'day' | 'week' | 'month';
}

export interface AdminStatsParams {
  from?: string; // ISO date
  to?: string; // ISO date
  days?: number; // shortcut window, ignored when from/to provided
  bucket?: 'day' | 'week' | 'month';
}

export interface AdminRefundResponse {
  ok: boolean;
  refundId?: string;
  refundStatus?: string;
  order?: Order;
}

export interface AuthResponse {
  token: string;
  user: User;
}
