import { useState } from 'react';
import { useCoupons, useCreateCoupon, useDeleteCoupon } from '@/api/coupons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Trash2, Plus } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function AdminCoupons() {
  const { data, isLoading } = useCoupons();
  const create = useCreateCoupon();
  const remove = useDeleteCoupon();

  const [name, setName] = useState('');
  const [discount, setDiscount] = useState('');
  const [expiry, setExpiry] = useState('');

  const onCreate = () => {
    if (!name || !discount || !expiry) {
      toast.error('All fields are required');
      return;
    }
    create.mutate(
      {
        name,
        discount: Number(discount),
        expiry,
      },
      {
        onSuccess: () => {
          setName('');
          setDiscount('');
          setExpiry('');
          toast.success('Coupon created');
        },
        onError: (err: any) =>
          toast.error(err?.response?.data?.err ?? 'Failed'),
      },
    );
  };

  return (
    <div className="container py-8">
      <h1 className="mb-6 text-2xl font-semibold">Coupons</h1>

      <Card className="mb-6">
        <CardContent className="grid gap-3 p-4 sm:grid-cols-4">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value.toUpperCase())}
              placeholder="SUMMER10"
            />
          </div>
          <div className="space-y-2">
            <Label>Discount %</Label>
            <Input
              type="number"
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
              placeholder="10"
            />
          </div>
          <div className="space-y-2">
            <Label>Expiry</Label>
            <Input
              type="date"
              value={expiry}
              onChange={(e) => setExpiry(e.target.value)}
            />
          </div>
          <div className="flex items-end">
            <Button onClick={onCreate} disabled={create.isPending} className="w-full">
              <Plus className="mr-1 h-4 w-4" />
              Add
            </Button>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : (
        <div className="grid gap-3">
          {(data ?? []).map((c: any) => (
            <Card key={c._id}>
              <CardContent className="flex items-center gap-4 p-4">
                <span className="flex-1 font-medium">{c.name}</span>
                <span className="text-sm">{c.discount}%</span>
                <span className="text-xs text-muted-foreground">
                  expires {new Date(c.expiry).toLocaleDateString()}
                </span>
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => {
                    if (confirm(`Delete "${c.name}"?`)) {
                      remove.mutate(c._id, {
                        onSuccess: () => toast.success('Deleted'),
                      });
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}