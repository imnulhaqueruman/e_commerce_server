import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/fetcher';
import type {
  AdminRefundResponse,
  AdminStats,
  AdminStatsParams,
  Order,
} from '@/types';

export const useAdminOrders = () => {
  return useQuery({
    queryKey: ['admin', 'orders'],
    queryFn: async () => {
      const { data } = await api.get<Order[]>('/admin/orders');
      return data;
    },
  });
};

export const useUpdateOrderStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { id: string; status: string }) => {
      const { data } = await api.put('/admin/order-status', {
        orderId: payload.id,
        orderStatus: payload.status,
      });
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'orders'] }),
  });
};

// Server-side aggregation. Accepts a window either as `from`/`to` ISO dates
// or as `days` (shortcut). `bucket` controls the revenueSeries grouping.
// Server caps `days` at 365 and clamps `to` to be >= `from`.
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
      const { data } = await api.get<AdminStats>('/admin/stats', {
        params: qs,
      });
      return data;
    },
    staleTime: 60_000,
  });
};

export const useRefundOrder = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (orderId: string) => {
      const { data } = await api.post<AdminRefundResponse>(
        `/admin/orders/${orderId}/refund`,
      );
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'orders'] });
      qc.invalidateQueries({ queryKey: ['admin', 'stats'] });
    },
  });
};