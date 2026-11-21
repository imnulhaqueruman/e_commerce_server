import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Elements, CardElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { AlertCircle, CreditCard, Lock, PackageX } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { toast } from 'sonner';
import { Button } from '@/shared/ui/primitives/button';
import { Label } from '@/shared/ui/primitives/label';
import { Textarea } from '@/shared/ui/primitives/textarea';
import {
  useCart,
  useCreateOrder,
  useCreatePaymentIntent,
  useSaveAddress,
} from '@/features/cart/api/cart';
import { useAuthStore } from '@/features/auth/store/authStore';
import { formatCurrency, primaryImage } from '@/shared/lib/format';
import { isStripeConfigured, stripePublishableKey } from '@/shared/lib/constants';
import { EmptyState } from '@/shared/ui';
import type { CartItem, Product } from '@/shared/types';

const stripePromise = isStripeConfigured
  ? loadStripe(stripePublishableKey as string)
  : null;

const lineProduct = (item: CartItem): Product | undefined =>
  typeof item.product === 'string' ? undefined : item.product;

function CheckoutForm() {
  const navigate = useNavigate();
  const stripe = useStripe();
  const elements = useElements();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  const { data: cart } = useCart();
  const saveAddress = useSaveAddress();
  const createIntent = useCreatePaymentIntent();
  const createOrder = useCreateOrder();

  const [address, setAddress] = useState(user?.address ?? '');
  const [processing, setProcessing] = useState(false);
  const [cardError, setCardError] = useState<string | null>(null);

  useEffect(() => {
    setAddress(user?.address ?? '');
  }, [user]);

  const items = useMemo(() => cart?.products ?? [], [cart?.products]);

  const subtotal = useMemo(
    () =>
      items.reduce((sum, item) => {
        const price = lineProduct(item)?.price ?? item.price ?? 0;
        return sum + Number(price) * (item.count ?? 1);
      }, 0),
    [items],
  );

  const discountPct = cart?.couponApplied?.discount ?? 0;
  const total = useMemo(() => {
    if (cart?.totalAfterDiscount != null) return cart.totalAfterDiscount;
    return Math.max(0, subtotal * (1 - discountPct / 100));
  }, [cart?.totalAfterDiscount, subtotal, discountPct]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCardError(null);

    if (!stripe || !elements) {
      setCardError('Payment is not ready yet. Please try again.');
      return;
    }

    if (!address.trim()) {
      setCardError('Please enter a shipping address.');
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setCardError('The payment form failed to load.');
      return;
    }

    setProcessing(true);

    try {
      // Persist the address first so the order carries it.
      await saveAddress.mutateAsync(address);
      if (user && address !== user.address) {
        setUser({ ...user, address });
      }

      // `couponApplied` tells the server to charge the discounted total.
      const intent = await createIntent.mutateAsync({
        couponApplied: Boolean(cart?.couponApplied),
      });

      const result = await stripe.confirmCardPayment(intent.clientSecret, {
        payment_method: { card: cardElement },
      });

      if (result.error) {
        setCardError(result.error.message ?? 'Payment failed');
        setProcessing(false);
        return;
      }

      await createOrder.mutateAsync({
        paymentIntent: result.paymentIntent,
      });

      toast.success('Order placed');
      navigate('/order/success');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Checkout failed';
      setCardError(message);
      setProcessing(false);
    }
  };

  if (items.length === 0) {
    return (
      <EmptyState
        icon={<PackageX className="h-5 w-5" />}
        title="Your cart is empty"
        description="Add something to your cart before checking out."
        action={
          <Button asChild>
            <Link to="/shop">Browse the shop</Link>
          </Button>
        }
      />
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        {/* Address */}
        <section className="rounded-xl border bg-card p-6">
          <h2 className="text-lg font-semibold">Shipping address</h2>
          <div className="mt-4 space-y-2">
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="123 Main St, City, State, ZIP"
              required
              rows={4}
            />
          </div>
        </section>

        {/* Payment */}
        <section className="rounded-xl border bg-card p-6">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <CreditCard className="h-5 w-5" />
            Payment
          </h2>

          <div className="mt-4 rounded-lg border bg-background p-4">
            <CardElement
              options={{
                hidePostalCode: true,
                style: {
                  base: {
                    fontSize: '16px',
                    color: '#111827',
                    fontFamily: 'ui-sans-serif, system-ui, sans-serif',
                    '::placeholder': { color: '#9ca3af' },
                  },
                  invalid: { color: '#dc2626' },
                },
              }}
            />
          </div>

          <p className="mt-3 text-xs text-muted-foreground">
            Test card: 4242 4242 4242 4242 · any future expiry · any CVC.
          </p>

          {cardError ? (
            <p
              role="alert"
              className="mt-4 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {cardError}
            </p>
          ) : null}
        </section>
      </div>

      {/* Summary */}
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="space-y-4 rounded-xl border bg-card p-5">
          <h2 className="text-lg font-semibold">Summary</h2>

          <ul className="space-y-3">
            {items.map((item, index) => {
              const product = lineProduct(item);
              const price = Number(product?.price ?? item.price ?? 0);
              return (
                <li key={product?._id ?? index} className="flex gap-3">
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md bg-muted">
                    {product && primaryImage(product.images) ? (
                      <img
                        src={primaryImage(product.images)}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1 text-sm">
                    <p className="truncate font-medium">
                      {product?.title ?? 'Product'}
                    </p>
                    <p className="text-muted-foreground">
                      × {item.count ?? 1}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-medium">
                    {formatCurrency(price * (item.count ?? 1))}
                  </span>
                </li>
              );
            })}
          </ul>

          <dl className="space-y-2 border-t pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd className="font-medium">{formatCurrency(subtotal)}</dd>
            </div>
            {cart?.couponApplied ? (
              <div className="flex justify-between text-success">
                <dt>Discount ({cart.couponApplied.discount}%)</dt>
                <dd className="font-medium">
                  −{formatCurrency(subtotal - total)}
                </dd>
              </div>
            ) : null}
            <div className="flex justify-between border-t pt-2 text-base font-semibold">
              <dt>Total</dt>
              <dd>{formatCurrency(total)}</dd>
            </div>
          </dl>

          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={processing || !stripe || !elements}
          >
            <Lock className="mr-2 h-4 w-4" />
            {processing
              ? 'Processing…'
              : `Pay ${formatCurrency(total)}`}
          </Button>
        </div>
      </aside>
    </form>
  );
}

export default function Checkout() {
  return (
    <div className="section space-y-6">
      <Helmet>
        <title>Checkout · Shopper</title>
      </Helmet>

      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Checkout</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Confirm your address and pay securely.
        </p>
      </div>

      {!isStripeConfigured || !stripePromise ? (
        <div className="rounded-xl border border-dashed p-8 text-center">
          <CreditCard className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-3 font-medium">Payments are not configured</p>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
            Add <code className="rounded bg-muted px-1 py-0.5 text-xs">VITE_STRIPE_PUBLISHABLE_KEY</code>{' '}
            to the client environment to enable checkout.
          </p>
          <Button asChild variant="outline" className="mt-5">
            <Link to="/cart">Back to cart</Link>
          </Button>
        </div>
      ) : (
        <Elements stripe={stripePromise}>
          <CheckoutForm />
        </Elements>
      )}
    </div>
  );
}
