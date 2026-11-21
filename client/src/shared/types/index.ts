/**
 * Shared domain types.
 *
 * These mirror the API contract documented in `CLAUDE.md`. Anything the
 * server returns as a plain string stays a string here — the API stores
 * `Product.price` as a Number now, but `formatCurrency` still accepts both
 * so a stray string from an older record does not break rendering.
 */

export interface User {
  _id: string;
  email: string;
  name?: string;
  role?: 'admin' | 'subscribe' | string;
  address?: string;
  cart?: string[];
  wishlist?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
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
  /** Cloudinary stores the URL string directly — not an object. */
  images?: string[];
  color?: string;
  brand?: string;
  shipping?: 'Yes' | 'No' | string;
  ratings?: { star: number; postedBy: string }[];
  createdAt?: string;
}

export interface CartItem {
  product: Product | string;
  count: number;
  color: string;
  price: number;
  _id?: string;
}

export interface AppliedCoupon {
  name: string;
  discount: number;
  expiry?: string;
}

export interface Cart {
  products: CartItem[];
  cartTotal: number;
  totalAfterDiscount?: number | null;
  couponApplied?: AppliedCoupon | null;
}

export interface Order {
  _id: string;
  products: CartItem[];
  paymentIntent?: { id?: string; amount?: number; status?: string };
  orderStatus: OrderStatus;
  orderedBy: string;
  createdAt?: string;
  updatedAt?: string;
  cartTotal?: number;
}

/**
 * The canonical order-status vocabulary.
 *
 * This mirrors `controllers/admin.js#ALLOWED_STATUSES` and the `enum` on
 * `models/order.js`. It is case-sensitive: `processing` is lowercase
 * because that is what the server stores. Sending anything else returns
 * `400 Invalid orderStatus`.
 */
export const ORDER_STATUSES = [
  'Not Processed',
  'processing',
  'Dispatched',
  'Cancelled',
  'Completed',
  'Refunded',
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export interface Coupon {
  _id: string;
  name: string;
  expiry: string;
  discount: number;
}

/** The paginated shape returned by `POST /api/products`. */
export interface PaginatedProducts {
  items: Product[];
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}

export interface WishlistResponse {
  wishlist: Product[];
}

export interface AdminStats {
  ordersCount: number;
  productCount: number;
  couponCount: number;
  revenue: number;
  byStatus?: Record<string, number>;
  revenueSeries?: { date: string; total: number; count: number }[];
  windowDays?: number;
  range?: { from: string; to: string } | null;
  bucket?: 'day' | 'week' | 'month';
}

export interface AdminStatsParams {
  from?: string;
  to?: string;
  days?: number;
  bucket?: 'day' | 'week' | 'month';
}

export interface AdminRefundResponse {
  ok: boolean;
  refundId?: string;
  refundStatus?: string;
  order?: Order;
}

export interface PaymentIntentResponse {
  clientSecret: string;
  cartTotal: number;
  totalAfterDiscount: number;
  payable: number;
}

/** The filter set accepted by `POST /api/search/filters`. */
export interface ProductFilters {
  query?: string;
  price?: [number, number];
  category?: string;
  sub?: string;
  stars?: number;
  shipping?: string;
  color?: string;
  brand?: string;
}

/** Enumerations the Product schema constrains. */
export const PRODUCT_COLORS = [
  'Black',
  'Brown',
  'Silver',
  'White',
  'Blue',
] as const;

export const PRODUCT_BRANDS = [
  'Apple',
  'Samsung',
  'Microsoft',
  'Lenovo',
  'ASUS',
] as const;
