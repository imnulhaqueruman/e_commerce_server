import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/fetcher';
import type { Cart } from '@/types';

export const useCart = () => {
  return useQuery({
    queryKey: ['cart'],
    queryFn: async () => {
      const { data } = await api.get<Cart>('/user/cart');
      return data;
    },
  });
};

export const useSaveCart = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (cart: { _id: string; count: number; color: string }[]) => {
      const { data } = await api.post('/user/cart', { cart });
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cart'] }),
  });
};

export const useEmptyCart = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.delete('/user/cart');
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cart'] }),
  });
};

export const useApplyCoupon = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (coupon: string) => {
      const { data } = await api.post<number>('/user/cart/coupon', { coupon });
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cart'] }),
  });
};

export const useSaveAddress = () => {
  return useMutation({
    mutationFn: async (address: string) => {
      const { data } = await api.post('/user/address', { address });
      return data;
    },
  });
};

export const useCreatePaymentIntent = () => {
  return useMutation({
    mutationFn: async (payload: { couponApplied: boolean }) => {
      const { data } = await api.post('/create-payment-intent', payload);
      return data as {
        clientSecret: string;
        cartTotal: number;
        totalAfterDiscount: number;
        payable: number;
      };
    },
  });
};

export const useCreateOrder = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (stripeResponse: any) => {
      const { data } = await api.post('/user/order', { stripeResponse });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cart'] });
      qc.invalidateQueries({ queryKey: ['orders'] });
    },
  });
};