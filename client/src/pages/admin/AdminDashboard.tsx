import { useAdminStats } from '@/api/admin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/format';
import { Helmet } from 'react-helmet-async';
import { Package, ShoppingCart, Tag, Layers } from 'lucide-react';

export default function AdminDashboard() {
  const { data, isLoading } = useAdminStats();

  return (
    <div className="container py-8">
      <Helmet>
        <title>Admin dashboard · Shopper</title>
      </Helmet>
      <h1 className="mb-6 text-2xl font-semibold">Admin dashboard</h1>
      {isLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Revenue"
            value={formatCurrency(data?.revenue ?? 0)}
            icon={<ShoppingCart className="h-5 w-5" />}
          />
          <StatCard
            label="Orders"
            value={data?.ordersCount ?? 0}
            icon={<Package className="h-5 w-5" />}
          />
          <StatCard
            label="Products"
            value={data?.productCount ?? 0}
            icon={<Layers className="h-5 w-5" />}
          />
          <StatCard
            label="Coupons"
            value={data?.couponCount ?? 0}
            icon={<Tag className="h-5 w-5" />}
          />
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
        <span className="text-muted-foreground">{icon}</span>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}