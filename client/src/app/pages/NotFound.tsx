import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { Button } from '@/shared/ui/primitives/button';

export default function NotFound() {
  return (
    <div className="container flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Compass className="h-7 w-7" />
      </span>
      <p className="mt-6 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        404
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">
        We couldn&apos;t find that page
      </h1>
      <p className="mt-3 max-w-md text-sm text-muted-foreground">
        The link may be broken, or the product may have been removed from the
        catalogue.
      </p>
      <div className="mt-8 flex gap-3">
        <Button asChild>
          <Link to="/shop">Browse the shop</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/">Go home</Link>
        </Button>
      </div>
    </div>
  );
}
