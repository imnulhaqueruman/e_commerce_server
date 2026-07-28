import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useCart, useSaveAddress, useCreatePaymentIntent, useCreateOrder } from '@/api/cart';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/format';
import { Helmet } from 'react-helmet-async';
import { toast } from 'react-hot-toast';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ?? '');

function CheckoutForm() {
  const navigate = useNavigate();
  const stripe = useStripe();
  const elements = useElements();
  const user = useAuthStore((s) => s.user);
  const setAuth = useAuthStore((s) => s.setAuth);
  const token = useAuthStore((s) => s.token);

  const { data: cart } = useCart();
  const saveAddress = useSaveAddress();
  const createIntent = useCreatePaymentIntent();
  const createOrder = useCreateOrder();

  const [address, setAddress] = useState((user as any)?.address ?? '');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    setAddress((user as any)?.address ?? '');
  }, [user]);

  const subtotal = useMemo(
    () =>
      cart?.products?.reduce(
        (sum: number, it: any) =>
          sum + (it.product?.price ?? 0) * (it.count ?? 1),
        0,
      ) ?? 0,
    [cart],
  );
  const discountPct = cart?.couponApplied ? cart.couponApplied.discount ?? 0 : 0;
  const total = Math.max(0, subtotal * (1 - discountPct / 100));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setProcessing(true);

    try {
      saveAddress.mutate(address);
      if (user && address !== (user as any).address) {
        setAuth({ user: { ...user, address } as any, token: token! });
      }

      const intent = await createIntent.mutateAsync({ couponApplied: !!cart?.couponApplied });
      const clientSecret = intent.clientSecret;

      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement)!,
        },
      });

      if (result.error) {
        toast.error(result.error.message ?? 'Payment failed');
        setProcessing(false);
        return;
      }

      await createOrder.mutateAsync({
        paymentIntent: result.paymentIntent,
      });
      toast.success('Order placed');
      navigate('/order/success');
    } catch (err: any) {
      toast.error(err?.response?.data?.err ?? err?.message ?? 'Checkout failed');
      setProcessing(false);
    }
  };

  if (!cart?.products?.length) {
    return (
      <p className="text-sm text-muted-foreground">
        Your cart is empty.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Shipping address</CardTitle>
          </CardHeader>
          <CardContent>
            <Label htmlFor="addr">Address</Label>
            <textarea
              id="addr"
              className="mt-2 flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Payment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border border-input p-3">
              <CardElement options={{ hidePostalCode: true }} />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Test card: 4242 4242 4242 4242 · any future date · any CVC.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {cart.products.map((it: any) => (
            <div key={(it.product?._id ?? '') + Math.random()} className="flex justify-between">
              <span className="line-clamp-1">
                {it.product?.title} × {it.count}
              </span>
              <span>{formatCurrency((it.product?.price ?? 0) * (it.count ?? 1))}</span>
            </div>
          ))}
          <div className="flex justify-between border-t pt-3 font-semibold">
            <span>Total</span>
            <span>{formatCurrency(total)}</span>
          </div>
          <Button type="submit" className="w-full" disabled={processing || !stripe}>
            {processing ? 'Processing…' : `Pay ${formatCurrency(total)}`}
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}

export default function Checkout() {
  return (
    <div className="container py-8">
      <Helmet>
        <title>Checkout · Shopper</title>
      </Helmet>
      <h1 className="mb-6 text-2xl font-semibold">Checkout</h1>
      {import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ? (
        <Elements stripe={stripePromise}>
          <CheckoutForm />
        </Elements>
      ) : (
        <div className="rounded border border-dashed p-4 text-sm text-muted-foreground">
          Stripe is not configured. Add <code>VITE_STRIPE_PUBLISHABLE_KEY</code> to your client env.
        </div>
      )}
    </div>
  );
}