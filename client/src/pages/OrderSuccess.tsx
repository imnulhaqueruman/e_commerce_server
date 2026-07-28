import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { CheckCircle2 } from 'lucide-react';

export default function OrderSuccess() {
  return (
    <div className="container flex min-h-[60vh] flex-col items-center justify-center text-center">
      <Helmet>
        <title>Order confirmed · Shopper</title>
      </Helmet>
      <CheckCircle2 className="h-12 w-12 text-green-600" />
      <h1 className="mt-4 text-2xl font-semibold">Order confirmed</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Thanks for your purchase. You can track it under My account → Orders.
      </p>
      <div className="mt-6 flex gap-3">
        <Button asChild>
          <Link to="/user/orders">View orders</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to="/shop">Keep shopping</Link>
        </Button>
      </div>
    </div>
  );
}