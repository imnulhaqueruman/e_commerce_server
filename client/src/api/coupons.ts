import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/fetcher';
import type { Coupon } from '@/types';

export const useCoupons = () => {
  return useQuery({
    queryKey: ['coupons'],
    queryFn: async () => {
      const { data } = await api.get<Coupon[]>('/coupons');
      return data;
    },
  });
};

export const useCreateCoupon = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { name: string; expiry: string; discount: number }) => {
      const { data } = await api.post<Coupon>('/coupon', { coupon: payload });
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['coupons'] }),
  });
};

export const useDeleteCoupon = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (couponId: string) => {
      const { data } = await api.delete(`/coupon/${couponId}`);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['coupons'] }),
  });
};