import { useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Layers,
  ShoppingCart,
  Tag,
  TrendingUp,
} from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { Label } from '@/shared/ui/primitives/label';
import { Select } from '@/shared/ui/primitives/select';
import { StatCard } from '@/shared/ui';
import { StatusBadge } from '@/shared/ui/StatusBadge';
import { useAdminStats } from '@/features/admin/api/admin';
import { formatCurrency, formatDate } from '@/shared/lib/format';

const RANGES = [
  { label: 'Last 7 days', days: 7 },
  { label: 'Last 30 days', days: 30 },
  { label: 'Last 90 days', days: 90 },
  { label: 'Last 365 days', days: 365 },
];

export default function Dashboard() {
  const [rangeDays, setRangeDays] = useState(30);
  const [bucket, setBucket] = useState<'day' | 'week' | 'month'>('day');

  const { data, isLoading } = useAdminStats({ days: rangeDays, bucket });

  const series = data?.revenueSeries ?? [];
  const byStatus = data?.byStatus ?? {};

  return (
    <div className="section space-y-8">
      <Helmet>
        <title>Admin dashboard · Shopper</title>
      </Helmet>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            Admin dashboard
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Revenue, orders and catalogue health at a glance.
          </p>
        </div>

        <div className="flex flex-wrap items-end gap-2">
          <div className="space-y-1">
            <Label htmlFor="range" className="text-xs">
              Range
            </Label>
            <Select
              id="range"
              value={String(rangeDays)}
              onChange={(e) => setRangeDays(Number(e.target.value))}
              className="w-40"
            >
              {RANGES.map((range) => (
                <option key={range.days} value={range.days}>
                  {range.label}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="bucket" className="text-xs">
              Group by
            </Label>
            <Select
              id="bucket"
              value={bucket}
              onChange={(e) =>
                setBucket(e.target.value as 'day' | 'week' | 'month')
              }
              className="w-32"
            >
              <option value="day">Day</option>
              <option value="week">Week</option>
              <option value="month">Month</option>
            </Select>
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Revenue"
          value={formatCurrency(data?.revenue ?? 0)}
          icon={<TrendingUp className="h-4 w-4" />}
          hint={`Last ${rangeDays} days`}
        />
        <StatCard
          label="Orders"
          value={data?.ordersCount ?? 0}
          icon={<ShoppingCart className="h-4 w-4" />}
        />
        <StatCard
          label="Products"
          value={data?.productCount ?? 0}
          icon={<Layers className="h-4 w-4" />}
        />
        <StatCard
          label="Coupons"
          value={data?.couponCount ?? 0}
          icon={<Tag className="h-4 w-4" />}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Revenue chart */}
        <section className="rounded-xl border bg-card p-6 lg:col-span-2">
          <h2 className="text-lg font-semibold">Revenue over time</h2>

          {isLoading ? (
            <div className="mt-6 h-72 animate-pulse rounded-lg bg-muted" />
          ) : series.length === 0 ? (
            <div className="mt-6 flex h-72 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
              No revenue data in this range.
            </div>
          ) : (
            <div className="mt-6 h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={series}>
                  <defs>
                    <linearGradient
                      id="revenueFill"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor="hsl(var(--primary))"
                        stopOpacity={0.3}
                      />
                      <stop
                        offset="95%"
                        stopColor="hsl(var(--primary))"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    tickFormatter={(value: string) =>
                      formatDate(value).replace(/,.*/, '')
                    }
                    stroke="hsl(var(--border))"
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    stroke="hsl(var(--border))"
                    width={56}
                  />
                  <Tooltip
                    formatter={(value) => [
                      formatCurrency(Number(value)),
                      'Revenue',
                    ]}
                    labelFormatter={(label) => formatDate(String(label))}
                    contentStyle={{
                      borderRadius: 12,
                      border: '1px solid hsl(var(--border))',
                      background: 'hsl(var(--popover))',
                      color: 'hsl(var(--popover-foreground))',
                      fontSize: 12,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="total"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    fill="url(#revenueFill)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>

        {/* Status breakdown */}
        <section className="rounded-xl border bg-card p-6">
          <h2 className="text-lg font-semibold">Orders by status</h2>

          {isLoading ? (
            <div className="mt-6 space-y-3">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-9 animate-pulse rounded bg-muted" />
              ))}
            </div>
          ) : Object.keys(byStatus).length === 0 ? (
            <div className="mt-6 flex h-40 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
              No orders in this range.
            </div>
          ) : (
            <ul className="mt-5 space-y-3">
              {Object.entries(byStatus).map(([status, count]) => (
                <li
                  key={status}
                  className="flex items-center justify-between gap-3"
                >
                  <StatusBadge status={status} />
                  <span className="font-medium tabular-nums">{count}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
