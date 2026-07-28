import { useAdminOrders, useUpdateOrderStatus } from '@/api/admin';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate } from '@/lib/format';
import { Helmet } from 'react-helmet-async';
import { toast } from 'react-hot-toast';

const STATUSES = [
  'Not Processed',
  'Processing',
  'Shipped',
  'Delivered',
  'Cancelled',
];

export default function AdminOrders() {
  const { data, isLoading } = useAdminOrders();
  const updateStatus = useUpdateOrderStatus();

  return (
    <div className="container py-8">
      <Helmet>
        <title>Orders · Admin · Shopper</title>
      </Helmet>
      <h1 className="mb-6 text-2xl font-semibold">Orders</h1>
      {isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <div className="space-y-3">
          {(data ?? []).map((o: any) => (
            <Card key={o._id}>
              <CardContent className="flex flex-wrap items-center gap-3 p-4">
                <div className="min-w-[120px]">
                  <p className="text-sm font-medium">
                    #{o._id.slice(-6).toUpperCase()}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(o.createdAt)}
                  </p>
                </div>
                <div className="text-sm">
                  {o.products?.length ?? 0} items
                </div>
                <div className="text-sm font-semibold">
                  {formatCurrency(o.cartTotal ?? o.paymentIntent?.amount ?? 0)}
                </div>
                <select
                  defaultValue={o.orderStatus ?? 'Not Processed'}
                  onChange={(e) =>
                    updateStatus.mutate(
                      { id: o._id, status: e.target.value },
                      { onSuccess: () => toast.success('Updated') },
                    )
                  }
                  className="ml-auto flex h-9 rounded-md border border-input bg-background px-2 text-sm"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}