import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/fetcher';
import type { Order, Product } from '@/types';

export const useOrders = () => {
  return useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const { data } = await api.get<Order[]>('/user/orders');
      return data;
    },
  });
};

export const useUpdateProfile = () => {
  return useMutation({
    mutationFn: async (payload: { name?: string; address?: string }) => {
      const { data } = await api.post('/user/profile', payload);
      return data as { user: any };
    },
  });
};

export const useWishlist = () => {
  return useQuery({
    queryKey: ['wishlist'],
    queryFn: async () => {
      const { data } = await api.get('/user/wishlist');
      return (data as { wishlist: Product[] }).wishlist ?? [];
    },
  });
};

export const useAddToWishlist = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (productId: string) => {
      const { data } = await api.post('/user/wishlist', { productId });
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wishlist'] }),
  });
};

export const useRemoveFromWishlist = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (productId: string) => {
      const { data } = await api.put(`/user/wishlist/${productId}`);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wishlist'] }),
  });
};