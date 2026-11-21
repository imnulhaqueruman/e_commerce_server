import { Link } from 'react-router-dom';
import { ArrowRight, Package, Sparkles, Truck } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { useLatestProducts } from '@/features/catalog/api/products';
import { useCategories } from '@/features/catalog/api/categories';
import { ProductGrid } from '@/features/catalog/components/ProductGrid';
import { Button } from '@/shared/ui/primitives/button';
import { HOME_PRODUCT_COUNT } from '@/shared/lib/constants';

const VALUE_PROPS = [
  {
    icon: <Truck className="h-5 w-5" />,
    title: 'Fast delivery',
    description: 'Tracked shipping on every order, dispatched within 24 hours.',
  },
  {
    icon: <Sparkles className="h-5 w-5" />,
    title: 'Curated quality',
    description: 'Every product is reviewed before it reaches the catalogue.',
  },
  {
    icon: <Package className="h-5 w-5" />,
    title: 'Easy returns',
    description: 'Changed your mind? Send it back within 30 days, no fuss.',
  },
];

export default function Home() {
  const { data: products, isLoading } = useLatestProducts(HOME_PRODUCT_COUNT);
  const { data: categories = [] } = useCategories();

  return (
    <>
      <Helmet>
        <title>Shopper — Curated electronics and everyday essentials</title>
        <meta
          name="description"
          content="Browse a curated catalogue of electronics and everyday essentials, delivered to your door."
        />
      </Helmet>

      {/* Hero */}
      <section className="relative overflow-hidden border-b">
        <div className="hero-grid absolute inset-0 -z-10 opacity-60" />
        <div className="container flex flex-col items-center gap-6 py-20 text-center md:py-28">
          <span className="inline-flex items-center gap-1.5 rounded-full border bg-background/70 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
            <Sparkles className="h-3 w-3" />
            New season — hand-picked favourites
          </span>
          <h1 className="max-w-3xl text-balance text-4xl font-bold tracking-tight md:text-6xl">
            Discover. Shop. Smile.
          </h1>
          <p className="max-w-2xl text-pretty text-base text-muted-foreground md:text-lg">
            Browse our curated collection of premium products — electronics,
            accessories and more — shipped to your door.
          </p>
          <div className="flex flex-col items-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="group">
              <Link to="/shop">
                Start shopping
                <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/shop">Browse categories</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Value props */}
      <section className="container grid gap-6 py-12 sm:grid-cols-3 md:py-16">
        {VALUE_PROPS.map((prop) => (
          <div key={prop.title} className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              {prop.icon}
            </span>
            <div>
              <p className="font-medium">{prop.title}</p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {prop.description}
              </p>
            </div>
          </div>
        ))}
      </section>

      {/* Categories */}
      {categories.length > 0 ? (
        <section className="container space-y-6 pb-12 md:pb-16">
          <div className="flex items-end justify-between">
            <h2 className="text-2xl font-semibold">Shop by category</h2>
            <Button asChild variant="link" className="hidden sm:inline-flex">
              <Link to="/shop">View all</Link>
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {categories.slice(0, 8).map((category) => (
              <Link
                key={category._id}
                to={`/category/${category.slug}`}
                className="group flex items-center justify-between rounded-xl border bg-card p-5 text-sm font-medium shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
              >
                <span className="truncate">{category.name}</span>
                <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100 group-hover:text-primary" />
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {/* New arrivals */}
      <section className="container space-y-6 pb-16">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Newest arrivals</h2>
            <p className="text-sm text-muted-foreground">
              The latest additions to the catalogue.
            </p>
          </div>
          <Button asChild variant="link" className="group shrink-0">
            <Link to="/shop">
              View all
              <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </Button>
        </div>
        <ProductGrid products={products} loading={isLoading} />
      </section>
    </>
  );
}
