import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { http } from '@/shared/lib/http';
import type {
  AdminRefundResponse,
  AdminStats,
  AdminStatsParams,
  Coupon,
  Order,
  OrderStatus,
} from '@/shared/types';

export const useAdminOrders = () => {
  return useQuery({
    queryKey: ['admin', 'orders'],
    queryFn: async () => {
      const { data } = await http.get<Order[]>('/admin/orders');
      return data;
    },
    staleTime: 15_000,
  });
};

/**
 * Change an order's status.
 *
 * `orderStatus` must be one of the canonical values in `ORDER_STATUSES` —
 * the server rejects anything else with `400 Invalid orderStatus`.
 */
export const useUpdateOrderStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string;
      status: OrderStatus;
    }) => {
      const { data } = await http.put<Order>('/admin/order-status', {
        orderId: id,
        orderStatus: status,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
    },
  });
};

/**
 * Server-side stats aggregation.
 *
 * Accepts a window either as `from`/`to` ISO dates or as `days`. The
 * server caps `days` at 365 and clamps `to` to be >= `from`.
 */
export const useAdminStats = (params: AdminStatsParams = {}) => {
  const { from, to, days = 30, bucket = 'day' } = params;
  const queryKey = ['admin', 'stats', { from, to, days, bucket }];

  return useQuery({
    queryKey,
    queryFn: async (): Promise<AdminStats> => {
      const qs: Record<string, string | number> = { bucket };
      if (from || to) {
        if (from) qs.from = from;
        if (to) qs.to = to;
      } else {
        qs.days = days;
      }
      const { data } = await http.get<AdminStats>('/admin/stats', {
        params: qs,
      });
      return data;
    },
    staleTime: 60_000,
  });
};

export const useRefundOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderId: string) => {
      const { data } = await http.post<AdminRefundResponse>(
        `/admin/orders/${orderId}/refund`,
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
    },
  });
};

export const useCoupons = () => {
  return useQuery({
    queryKey: ['admin', 'coupons'],
    queryFn: async () => {
      const { data } = await http.get<Coupon[]>('/coupons');
      return data;
    },
    staleTime: 60_000,
  });
};

/**
 * Create a coupon.
 *
 * The body shape is `{ coupon: { name, expiry, discount } }` — the nested
 * wrapper is intentional so metadata can be added later without a
 * breaking change.
 */
export const useCreateCoupon = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      name: string;
      expiry: string;
      discount: number;
    }) => {
      const { data } = await http.post<Coupon>('/coupon', {
        coupon: payload,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'coupons'] });
    },
  });
};

export const useDeleteCoupon = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (couponId: string) => {
      const { data } = await http.delete(`/coupon/${couponId}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'coupons'] });
    },
  });
};
