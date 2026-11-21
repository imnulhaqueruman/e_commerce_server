import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { http } from '@/shared/lib/http';
import type {
  AppliedCoupon,
  Cart,
  Order,
  PaymentIntentResponse,
} from '@/shared/types';

export interface CartLineInput {
  _id: string;
  count: number;
  color: string;
}

export const useCart = () => {
  return useQuery({
    queryKey: ['cart'],
    queryFn: async () => {
      const { data } = await http.get<Cart>('/user/cart');
      return data;
    },
    staleTime: 10_000,
  });
};

/**
 * Replace the server-side cart.
 *
 * The API deletes the existing cart and re-derives every line price from
 * the database, so the client only sends `{ _id, count, color }`.
 */
export const useSaveCart = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (cart: CartLineInput[]) => {
      const { data } = await http.post<{ ok: boolean }>('/user/cart', { cart });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });
};

export const useEmptyCart = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data } = await http.delete('/user/cart');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });
};

/**
 * Apply a coupon to the cart.
 *
 * On success the response carries `totalAfterDiscount` and the
 * `couponApplied` snapshot. A miss is a 400, which surfaces as an
 * `ApiError` with `status === 400`.
 */
export const useApplyCoupon = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (coupon: string) => {
      const { data } = await http.post<{
        totalAfterDiscount: number;
        couponApplied: AppliedCoupon;
        cartTotal: number;
      }>('/user/cart/coupon', { coupon });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });
};

export const useSaveAddress = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (address: string) => {
      const { data } = await http.post<{ ok: boolean }>('/user/address', {
        address,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
    },
  });
};

/**
 * Create a Stripe PaymentIntent for the current cart.
 *
 * `couponApplied` must reflect whether a coupon is actually on the cart —
 * the server charges the discounted total only when it is true.
 */
export const useCreatePaymentIntent = () => {
  return useMutation({
    mutationFn: async (payload: { couponApplied: boolean }) => {
      const { data } = await http.post<PaymentIntentResponse>(
        '/create-payment-intent',
        payload,
      );
      return data;
    },
  });
};

export const useCreateOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (stripeResponse: {
      paymentIntent: unknown;
    }) => {
      const { data } = await http.post<{ ok: boolean; order: Order }>(
        '/user/order',
        { stripeResponse },
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      queryClient.invalidateQueries({ queryKey: ['account', 'orders'] });
      queryClient.invalidateQueries({ queryKey: ['catalog'] });
    },
  });
};
