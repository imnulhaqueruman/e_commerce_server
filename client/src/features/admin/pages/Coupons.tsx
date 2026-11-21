import { useState } from 'react';
import { Plus, Tag, Trash2 } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { toast } from 'sonner';
import { Button } from '@/shared/ui/primitives/button';
import { Input } from '@/shared/ui/primitives/input';
import { Label } from '@/shared/ui/primitives/label';
import { DataTable } from '@/shared/ui/DataTable';
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog';
import { PageHeader } from '@/shared/ui';
import {
  useCreateCoupon,
  useCoupons,
  useDeleteCoupon,
} from '@/features/admin/api/admin';
import { formatDate } from '@/shared/lib/format';
import type { Coupon } from '@/shared/types';

export default function Coupons() {
  const { data: coupons = [], isLoading } = useCoupons();
  const createCoupon = useCreateCoupon();
  const deleteCoupon = useDeleteCoupon();

  const [name, setName] = useState('');
  const [discount, setDiscount] = useState('');
  const [expiry, setExpiry] = useState('');
  const [pendingDelete, setPendingDelete] = useState<Coupon | null>(null);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();

    const trimmed = name.trim().toUpperCase();
    const value = Number(discount);

    if (!trimmed || !expiry || Number.isNaN(value)) {
      toast.error('Name, discount and expiry are all required');
      return;
    }
    if (value <= 0 || value > 100) {
      toast.error('The discount must be between 1 and 100');
      return;
    }

    createCoupon.mutate(
      { name: trimmed, discount: value, expiry },
      {
        onSuccess: () => {
          toast.success('Coupon created');
          setName('');
          setDiscount('');
          setExpiry('');
        },
        onError: (error) => {
          toast.error(
            error instanceof Error ? error.message : 'Could not create the coupon',
          );
        },
      },
    );
  };

  const handleDelete = () => {
    if (!pendingDelete) return;
    deleteCoupon.mutate(pendingDelete._id, {
      onSuccess: () => {
        toast.success('Coupon deleted');
        setPendingDelete(null);
      },
      onError: (error) => {
        toast.error(
          error instanceof Error ? error.message : 'Could not delete the coupon',
        );
      },
    });
  };

  const isExpired = (coupon: Coupon) =>
    new Date(coupon.expiry).getTime() < Date.now();

  return (
    <div className="section space-y-6">
      <Helmet>
        <title>Coupons · Admin · Shopper</title>
      </Helmet>

      <PageHeader
        title="Coupons"
        description="Discount codes customers can apply at checkout."
      />

      <form
        onSubmit={handleCreate}
        className="grid gap-4 rounded-xl border bg-card p-5 sm:grid-cols-4 sm:items-end"
      >
        <div className="space-y-2">
          <Label htmlFor="coupon-name">Code</Label>
          <Input
            id="coupon-name"
            value={name}
            onChange={(e) => setName(e.target.value.toUpperCase())}
            placeholder="SUMMER10"
            maxLength={12}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="coupon-discount">Discount %</Label>
          <Input
            id="coupon-discount"
            type="number"
            min={1}
            max={100}
            value={discount}
            onChange={(e) => setDiscount(e.target.value)}
            placeholder="10"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="coupon-expiry">Expiry</Label>
          <Input
            id="coupon-expiry"
            type="date"
            value={expiry}
            onChange={(e) => setExpiry(e.target.value)}
          />
        </div>

        <Button type="submit" disabled={createCoupon.isPending}>
          <Plus className="mr-1.5 h-4 w-4" />
          {createCoupon.isPending ? 'Adding…' : 'Add coupon'}
        </Button>
      </form>

      <DataTable
        columns={[
          {
            key: 'name',
            header: 'Code',
            render: (coupon: Coupon) => (
              <span className="flex items-center gap-2 font-medium">
                <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                {coupon.name}
              </span>
            ),
          },
          {
            key: 'discount',
            header: 'Discount',
            render: (coupon: Coupon) => (
              <span className="font-medium">{coupon.discount}%</span>
            ),
          },
          {
            key: 'expiry',
            header: 'Expires',
            render: (coupon: Coupon) => (
              <span
                className={isExpired(coupon) ? 'text-destructive' : undefined}
              >
                {formatDate(coupon.expiry)}
                {isExpired(coupon) ? ' (expired)' : ''}
              </span>
            ),
          },
          {
            key: 'actions',
            header: '',
            className: 'text-right',
            headerClassName: 'text-right',
            render: (coupon: Coupon) => (
              <Button
                variant="destructive"
                size="icon"
                aria-label={`Delete ${coupon.name}`}
                onClick={() => setPendingDelete(coupon)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            ),
          },
        ]}
        rows={coupons}
        loading={isLoading}
        emptyMessage="No coupons yet."
      />

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title="Delete this coupon?"
        description={
          pendingDelete
            ? `“${pendingDelete.name}” will stop working immediately.`
            : undefined
        }
        confirmLabel="Delete"
        destructive
        pending={deleteCoupon.isPending}
        onConfirm={handleDelete}
      />
    </div>
  );
}
