import { Link } from 'react-router-dom';
import { useOrders } from '@/api/user';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate } from '@/lib/format';
import { Helmet } from 'react-helmet-async';

export default function Orders() {
  const { data: orders, isLoading } = useOrders();

  return (
    <div className="container py-8">
      <Helmet>
        <title>My orders · Shopper</title>
      </Helmet>
      <h1 className="mb-6 text-2xl font-semibold">My orders</h1>
      {isLoading ? (
        <div className="space-y-3" aria-busy="true" aria-label="Loading orders">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-5 w-20 rounded-full" />
                <Skeleton className="h-5 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : !orders || orders.length === 0 ? (
        <div className="rounded-lg border border-dashed p-6 text-center">
          <p className="text-sm text-muted-foreground">No orders yet.</p>
          <Button asChild className="mt-3">
            <Link to="/shop">Start shopping</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((o: any) => (
            <Card key={o._id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div>
                  <p className="text-sm font-medium">
                    Order #{o._id.slice(-6).toUpperCase()}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(o.createdAt)}
                  </p>
                </div>
                <span className="rounded-full border px-2 py-0.5 text-xs">
                  {o.orderStatus ?? 'processing'}
                </span>
                <div className="text-sm font-semibold">
                  {formatCurrency(o.cartTotal ?? o.paymentIntent?.amount ?? 0)}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}