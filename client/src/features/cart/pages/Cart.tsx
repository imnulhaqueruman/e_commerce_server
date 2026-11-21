import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Minus, PackageX, Plus, ShoppingCart, Tag, Trash2 } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { toast } from 'sonner';
import { Button } from '@/shared/ui/primitives/button';
import { Input } from '@/shared/ui/primitives/input';
import {
  useApplyCoupon,
  useCart,
  useEmptyCart,
  useSaveCart,
} from '@/features/cart/api/cart';
import { formatCurrency, primaryImage } from '@/shared/lib/format';
import { EmptyState } from '@/shared/ui';
import type { CartItem, Product } from '@/shared/types';

/**
 * Resolve a cart line's product.
 *
 * The populated product is an object; the fallback is the bare id string
 * for a line whose product was deleted from the catalogue.
 */
const lineProduct = (item: CartItem): Product | undefined =>
  typeof item.product === 'string' ? undefined : item.product;

export default function Cart() {
  const navigate = useNavigate();
  const { data: cart, isLoading, isError } = useCart();
  const saveCart = useSaveCart();
  const emptyCart = useEmptyCart();
  const applyCoupon = useApplyCoupon();

  const [couponCode, setCouponCode] = useState('');

  // The server is the source of truth for the cart. Local edits are
  // applied optimistically and then persisted.
  const items = useMemo(() => cart?.products ?? [], [cart?.products]);
  const subtotal = useMemo(
    () =>
      items.reduce((sum, item) => {
        const price = lineProduct(item)?.price ?? item.price ?? 0;
        const count = item.count ?? 1;
        return sum + Number(price) * count;
      }, 0),
    [items],
  );

  const discountPct = cart?.couponApplied?.discount ?? 0;
  const total = useMemo(() => {
    if (cart?.totalAfterDiscount != null) return cart.totalAfterDiscount;
    return Math.max(0, subtotal * (1 - discountPct / 100));
  }, [cart?.totalAfterDiscount, subtotal, discountPct]);

  /**
   * Persist the cart with the given line changes.
   */
  const persist = async (
    nextItems: CartItem[],
    message?: string,
  ) => {
    try {
      await saveCart.mutateAsync(
        nextItems.map((item) => ({
          _id:
            lineProduct(item)?._id ??
            (typeof item.product === 'string' ? item.product : item._id) ??
            '',
          count: item.count ?? 1,
          color: item.color ?? '',
        })),
      );
      if (message) toast.success(message);
    } catch {
      toast.error('Could not update your cart');
    }
  };

  const changeQuantity = (index: number, delta: number) => {
    const next = items.map((item, i) =>
      i === index
        ? { ...item, count: Math.max(1, (item.count ?? 1) + delta) }
        : item,
    );
    void persist(next);
  };

  const removeLine = (index: number) => {
    const next = items.filter((_, i) => i !== index);
    void persist(next, 'Item removed');
  };

  const handleApplyCoupon = async () => {
    const code = couponCode.trim();
    if (!code) return;

    try {
      const result = await applyCoupon.mutateAsync(code);
      setCouponCode('');
      toast.success(
        `Coupon ${result.couponApplied.name} applied — ${result.couponApplied.discount}% off`,
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'That coupon is not valid',
      );
    }
  };

  const handleEmpty = async () => {
    try {
      await emptyCart.mutateAsync();
      toast.success('Cart emptied');
    } catch {
      toast.error('Could not empty your cart');
    }
  };

  if (isLoading) {
    return (
      <div className="section">
        <div className="h-8 w-40 animate-pulse rounded bg-muted" />
        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <div className="space-y-3 lg:col-span-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-28 animate-pulse rounded-xl bg-muted"
              />
            ))}
          </div>
          <div className="h-64 animate-pulse rounded-xl bg-muted" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="section">
        <EmptyState
          icon={<ShoppingCart className="h-5 w-5" />}
          title="We could not load your cart"
          description="Something went wrong fetching your cart. Please try again."
        />
      </div>
    );
  }

  return (
    <div className="section space-y-6">
      <Helmet>
        <title>Your cart · Shopper</title>
      </Helmet>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Your cart</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {items.length} {items.length === 1 ? 'item' : 'items'}
          </p>
        </div>
        {items.length > 0 ? (
          <Button
            variant="outline"
            size="sm"
            onClick={handleEmpty}
            disabled={emptyCart.isPending}
          >
            <Trash2 className="mr-1.5 h-4 w-4" />
            Empty cart
          </Button>
        ) : null}
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={<PackageX className="h-5 w-5" />}
          title="Your cart is empty"
          description="Browse the catalogue and add something you like."
          action={
            <Button asChild>
              <Link to="/shop">Continue shopping</Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Lines */}
          <div className="space-y-3 lg:col-span-2">
            {items.map((item, index) => {
              const product = lineProduct(item);
              const price = Number(product?.price ?? item.price ?? 0);
              const count = item.count ?? 1;

              return (
                <div
                  key={product?._id ?? `${item._id}-${index}`}
                  className="flex flex-col gap-4 rounded-xl border bg-card p-4 sm:flex-row sm:items-center"
                >
                  <Link
                    to={product ? `/product/${product.slug}` : '#'}
                    className="shrink-0"
                  >
                    <div className="h-20 w-20 overflow-hidden rounded-lg bg-muted sm:h-24 sm:w-24">
                      {product && primaryImage(product.images) ? (
                        <img
                          src={primaryImage(product.images)}
                          alt={product.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-muted-foreground">
                          <PackageX className="h-6 w-6" />
                        </div>
                      )}
                    </div>
                  </Link>

                  <div className="min-w-0 flex-1">
                    <Link
                      to={product ? `/product/${product.slug}` : '#'}
                      className="font-medium hover:underline"
                    >
                      {product?.title ?? 'Unavailable product'}
                    </Link>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {formatCurrency(price)} each
                      {item.color ? ` · ${item.color}` : ''}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => changeQuantity(index, -1)}
                      disabled={count <= 1 || saveCart.isPending}
                      aria-label="Decrease quantity"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-8 text-center font-medium">{count}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => changeQuantity(index, 1)}
                      disabled={saveCart.isPending}
                      aria-label="Increase quantity"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="w-24 text-right font-semibold">
                    {formatCurrency(price * count)}
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeLine(index)}
                    disabled={saveCart.isPending}
                    aria-label={`Remove ${product?.title ?? 'item'} from cart`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
          </div>

          {/* Summary */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="space-y-4 rounded-xl border bg-card p-5">
              <h2 className="text-lg font-semibold">Summary</h2>

              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Subtotal</dt>
                  <dd className="font-medium">{formatCurrency(subtotal)}</dd>
                </div>

                {cart?.couponApplied ? (
                  <div className="flex justify-between text-success">
                    <dt className="flex items-center gap-1.5">
                      <Tag className="h-3.5 w-3.5" />
                      {cart.couponApplied.name}
                    </dt>
                    <dd className="font-medium">
                      −{cart.couponApplied.discount}%
                    </dd>
                  </div>
                ) : null}

                <div className="flex justify-between border-t pt-2 text-base font-semibold">
                  <dt>Total</dt>
                  <dd>{formatCurrency(total)}</dd>
                </div>
              </dl>

              {!cart?.couponApplied ? (
                <div className="space-y-2">
                  <label
                    htmlFor="coupon"
                    className="text-sm font-medium"
                  >
                    Have a coupon?
                  </label>
                  <div className="flex gap-2">
                    <Input
                      id="coupon"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      placeholder="SUMMER10"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          void handleApplyCoupon();
                        }
                      }}
                    />
                    <Button
                      onClick={handleApplyCoupon}
                      disabled={applyCoupon.isPending || !couponCode.trim()}
                    >
                      Apply
                    </Button>
                  </div>
                </div>
              ) : null}

              <Button
                className="w-full"
                size="lg"
                onClick={() => navigate('/checkout')}
              >
                Checkout
              </Button>

              <Button asChild variant="outline" className="w-full">
                <Link to="/shop">Continue shopping</Link>
              </Button>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
