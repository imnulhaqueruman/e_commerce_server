import { Link } from 'react-router-dom';
import { CheckCircle2, Package, ShoppingBag } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/shared/ui/primitives/button';

export default function OrderSuccess() {
  return (
    <div className="section">
      <Helmet>
        <title>Order confirmed · Shopper</title>
      </Helmet>

      <div className="mx-auto flex max-w-lg flex-col items-center rounded-xl border bg-card p-10 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-success/10 text-success">
          <CheckCircle2 className="h-7 w-7" />
        </span>

        <h1 className="mt-5 text-2xl font-semibold tracking-tight">
          Thanks for your order
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your payment went through and your order is being prepared. You can
          follow its progress from your account.
        </p>

        <div className="mt-8 flex flex-col gap-2 sm:flex-row">
          <Button asChild>
            <Link to="/user?tab=orders">
              <ShoppingBag className="mr-2 h-4 w-4" />
              View my orders
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/shop">
              <Package className="mr-2 h-4 w-4" />
              Continue shopping
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
