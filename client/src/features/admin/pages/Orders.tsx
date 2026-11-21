import { useState } from 'react';
import { Package, RotateCcw } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { toast } from 'sonner';
import { Button } from '@/shared/ui/primitives/button';
import { Select } from '@/shared/ui/primitives/select';
import { StatusBadge } from '@/shared/ui/StatusBadge';
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog';
import { PageHeader } from '@/shared/ui';
import {
  useAdminOrders,
  useRefundOrder,
  useUpdateOrderStatus,
} from '@/features/admin/api/admin';
import { formatCents, formatDate, orderReference } from '@/shared/lib/format';
import { ORDER_STATUSES, type Order, type OrderStatus } from '@/shared/types';

export default function Orders() {
  const { data: orders = [], isLoading } = useAdminOrders();
  const updateStatus = useUpdateOrderStatus();
  const refundOrder = useRefundOrder();

  const [pendingRefund, setPendingRefund] = useState<Order | null>(null);

  /**
   * The order amount.
   *
   * `paymentIntent.amount` is in cents (Stripe's unit). Fall back to the
   * cart total when the intent is missing.
   */
  const orderAmount = (order: Order) => {
    if (order.paymentIntent?.amount) {
      return formatCents(order.paymentIntent.amount);
    }
    return formatCents(Math.round((order.cartTotal ?? 0) * 100));
  };

  const handleStatusChange = (order: Order, status: OrderStatus) => {
    updateStatus.mutate(
      { id: order._id, status },
      {
        onSuccess: () => toast.success('Order status updated'),
        onError: (error) => {
          toast.error(
            error instanceof Error
              ? error.message
              : 'Could not update the order',
          );
        },
      },
    );
  };

  const handleRefund = () => {
    if (!pendingRefund) return;
    refundOrder.mutate(pendingRefund._id, {
      onSuccess: (result) => {
        toast.success(
          result.refundStatus === 'succeeded'
            ? 'Order refunded'
            : 'Refund submitted',
        );
        setPendingRefund(null);
      },
      onError: (error) => {
        toast.error(
          error instanceof Error ? error.message : 'Could not refund the order',
        );
      },
    });
  };

  return (
    <div className="section space-y-6">
      <Helmet>
        <title>Orders · Admin · Shopper</title>
      </Helmet>

      <PageHeader
        title="Orders"
        description="Update fulfilment status and issue refunds."
      />

      {isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-xl border border-dashed px-6 py-16 text-center">
          <Package className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-3 font-medium">No orders yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Orders placed in the shop will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <article
              key={order._id}
              className="rounded-xl border bg-card p-5"
            >
              <div className="flex flex-wrap items-center gap-4">
                <div className="min-w-[130px]">
                  <p className="font-medium">{orderReference(order._id)}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(order.createdAt)}
                  </p>
                </div>

                <div className="text-sm text-muted-foreground">
                  {order.products?.length ?? 0}{' '}
                  {order.products?.length === 1 ? 'item' : 'items'}
                </div>

                <div className="text-sm font-semibold">
                  {orderAmount(order)}
                </div>

                <StatusBadge status={order.orderStatus} className="ml-auto" />

                <Select
                  value={order.orderStatus ?? 'Not Processed'}
                  onChange={(e) =>
                    handleStatusChange(order, e.target.value as OrderStatus)
                  }
                  aria-label={`Status for order ${orderReference(order._id)}`}
                  className="w-40"
                  disabled={updateStatus.isPending}
                >
                  {ORDER_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </Select>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPendingRefund(order)}
                  disabled={order.orderStatus === 'Refunded' || refundOrder.isPending}
                >
                  <RotateCcw className="mr-1.5 h-4 w-4" />
                  Refund
                </Button>
              </div>

              {order.products?.length ? (
                <ul className="mt-4 flex flex-wrap gap-2 border-t pt-4">
                  {order.products.map((item, index) => (
                    <li
                      key={index}
                      className="rounded-md bg-muted px-2.5 py-1 text-xs text-muted-foreground"
                    >
                      {typeof item.product === 'string'
                        ? 'Product'
                        : item.product.title}{' '}
                      × {item.count}
                    </li>
                  ))}
                </ul>
              ) : null}
            </article>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(pendingRefund)}
        onOpenChange={(open) => !open && setPendingRefund(null)}
        title="Refund this order?"
        description={
          pendingRefund
            ? `${orderReference(pendingRefund._id)} for ${orderAmount(pendingRefund)} will be refunded through the payment provider.`
            : undefined
        }
        confirmLabel="Refund order"
        cancelLabel="Cancel"
        destructive
        pending={refundOrder.isPending}
        onConfirm={handleRefund}
      />
    </div>
  );
}
