import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart, useSaveCart, useEmptyCart, useApplyCoupon } from '@/api/cart';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/format';
import { Helmet } from 'react-helmet-async';
import { Trash2 } from 'lucide-react';

export default function Cart() {
  const navigate = useNavigate();
  const token = useAuthStore((s) => s.token);
  const { data: cart, isLoading } = useCart();
  const saveCart = useSaveCart();
  const emptyCart = useEmptyCart();
  const applyCoupon = useApplyCoupon();

  const [items, setItems] = useState<any[]>([]);
  const [coupon, setCoupon] = useState('');

  useEffect(() => {
    if (cart?.products) setItems(cart.products);
  }, [cart]);

  const subtotal = useMemo(
    () =>
      items.reduce((sum, it) => {
        const price = it.product?.price ?? it.price ?? 0;
        return sum + price * (it.count ?? it.quantity ?? 1);
      }, 0),
    [items],
  );

  const discountPct = cart?.couponApplied ? cart.couponApplied.discount ?? 0 : 0;
  const total = Math.max(0, subtotal * (1 - discountPct / 100));

  const updateQty = (idx: number, delta: number) => {
    setItems((prev) =>
      prev.map((it, i) =>
        i === idx
          ? { ...it, count: Math.max(1, (it.count ?? 1) + delta) }
          : it,
      ),
    );
  };

  const remove = (idx: number) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const persist = () => {
    const payload = items.map((it) => ({
      _id: it.product?._id ?? it._id,
      count: it.count ?? 1,
      color: it.color,
    }));
    saveCart.mutate(payload);
  };

  const onEmpty = () => {
    emptyCart.mutate(undefined, { onSuccess: () => setItems([]) });
  };

  const onApplyCoupon = () => {
    applyCoupon.mutate(coupon.trim(), {
      onError: (err: any) =>
        alert(err?.response?.data?.err ?? 'Invalid coupon'),
    });
  };

  if (!token) {
    return (
      <div className="container py-12 text-center">
        <Helmet>
          <title>Cart · Shopper</title>
        </Helmet>
        <p className="mb-3 text-sm">Please sign in to view your cart.</p>
        <Button asChild>
          <Link to="/login">Sign in</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <Helmet>
        <title>Cart · Shopper</title>
      </Helmet>
      <h1 className="mb-6 text-2xl font-semibold">Your cart</h1>
      {isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Your cart is empty. <Link to="/shop" className="text-primary underline">Continue shopping</Link>.
        </p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-3">
            {items.map((it, idx) => {
              const p = it.product ?? it;
              const qty = it.count ?? 1;
              return (
                <Card key={(p._id ?? '') + idx}>
                  <CardContent className="flex items-center gap-4 p-4">
                    <img
                      src={p.images?.[0]?.url}
                      alt={p.title}
                      className="h-20 w-20 rounded object-cover"
                    />
                    <div className="flex-1">
                      <Link
                        to={`/product/${p.slug}`}
                        className="font-medium hover:underline"
                      >
                        {p.title}
                      </Link>
                      <p className="text-sm text-muted-foreground">
                        {formatCurrency(p.price)} each
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateQty(idx, -1)}
                      >
                        −
                      </Button>
                      <span className="w-8 text-center">{qty}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateQty(idx, 1)}
                      >
                        +
                      </Button>
                    </div>
                    <div className="w-24 text-right font-semibold">
                      {formatCurrency((p.price ?? 0) * qty)}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => remove(idx)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
            <div className="flex gap-2">
              <Button variant="outline" onClick={persist} disabled={saveCart.isPending}>
                Save cart
              </Button>
              <Button variant="destructive" onClick={onEmpty} disabled={emptyCart.isPending}>
                Empty cart
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              {cart?.couponApplied && (
                <div className="flex justify-between text-green-600">
                  <span>Coupon ({cart.couponApplied.name})</span>
                  <span>−{discountPct}%</span>
                </div>
              )}
              <div className="flex justify-between border-t pt-3 text-base font-semibold">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>
              {!cart?.couponApplied && (
                <div className="flex gap-2 pt-2">
                  <Input
                    placeholder="Coupon code"
                    value={coupon}
                    onChange={(e) => setCoupon(e.target.value)}
                  />
                  <Button onClick={onApplyCoupon} disabled={applyCoupon.isPending}>
                    Apply
                  </Button>
                </div>
              )}
              <Button className="w-full" onClick={() => navigate('/checkout')}>
                Checkout
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}