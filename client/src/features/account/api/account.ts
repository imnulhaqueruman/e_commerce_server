import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { http } from '@/shared/lib/http';
import { useAuthStore } from '@/features/auth/store/authStore';
import type { Order, Product, User, WishlistResponse } from '@/shared/types';

export const useOrders = () => {
  return useQuery({
    queryKey: ['account', 'orders'],
    queryFn: async () => {
      const { data } = await http.get<Order[]>('/user/orders');
      return data;
    },
    staleTime: 10_000,
  });
};

/**
 * Update the signed-in user's profile.
 *
 * `POST /api/user/profile` returns `{ user }`; the auth store is updated
 * in place so the navbar reflects the new name immediately.
 */
export const useUpdateProfile = () => {
  const setUser = useAuthStore((s) => s.setUser);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { name?: string; address?: string }) => {
      const { data } = await http.post<{ user: User }>('/user/profile', payload);
      return data.user;
    },
    onSuccess: (user) => {
      if (user) setUser(user);
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
    },
  });
};

export const useWishlist = () => {
  return useQuery({
    queryKey: ['account', 'wishlist'],
    queryFn: async () => {
      const { data } = await http.get<WishlistResponse>('/user/wishlist');
      return data?.wishlist ?? [];
    },
  });
};

export const useAddToWishlist = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productId: string) => {
      const { data } = await http.post<{ ok: boolean }>('/user/wishlist', {
        productId,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['account', 'wishlist'] });
    },
  });
};

export const useRemoveFromWishlist = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productId: string) => {
      const { data } = await http.put<{ ok: boolean }>(
        `/user/wishlist/${productId}`,
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['account', 'wishlist'] });
    },
  });
};

/**
 * Whether a product is on the signed-in user's wishlist.
 *
 * Reads the same query cache the wishlist hook populates, so the heart
 * icon on a product card and the wishlist page never disagree.
 */
export const useIsWishlisted = (productId: string | undefined) => {
  const { data: wishlist = [] } = useWishlist();

  if (!productId) return false;
  return wishlist.some(
    (p: Product) => typeof p === 'string' ? p === productId : p?._id === productId,
  );
};
