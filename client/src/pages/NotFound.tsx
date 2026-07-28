import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="container flex min-h-[60vh] flex-col items-center justify-center text-center">
      <Helmet>
        <title>404 · Shopper</title>
      </Helmet>
      <h1 className="text-4xl font-bold">404</h1>
      <p className="mt-2 text-muted-foreground">Page not found.</p>
      <Button asChild className="mt-4">
        <Link to="/">Back home</Link>
      </Button>
    </div>
  );
}