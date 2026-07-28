import { Link } from 'react-router-dom';
import { ArrowRight, ShoppingBasket } from 'lucide-react';
import { useAllProducts } from '@/api/products';
import { useCategories } from '@/api/categories';
import { ProductCard } from '@/components/ProductCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Helmet } from 'react-helmet-async';

type GroceryItem = {
  _id: string;
  title: string;
  description: string;
  price: number;
  unit: string;
  image: string;
  tag?: string;
};

const GROCERIES: GroceryItem[] = [
  {
    _id: 'g-1',
    title: 'Organic Bananas',
    description: 'Sweet, fair-trade, ripened to order.',
    price: 1.29,
    unit: 'per lb',
    image:
      'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=600&q=70',
    tag: 'Fresh',
  },
  {
    _id: 'g-2',
    title: 'Heirloom Tomatoes',
    description: 'Vine-ripened, mixed medley pack.',
    price: 4.5,
    unit: 'per lb',
    image:
      'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=600&q=70',
  },
  {
    _id: 'g-3',
    title: 'Sourdough Bread',
    description: 'Stone-baked daily, locally milled flour.',
    price: 6.0,
    unit: 'per loaf',
    image:
      'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=70',
    tag: 'Bakery',
  },
  {
    _id: 'g-4',
    title: 'Free-Range Eggs',
    description: 'Dozen large, pasture-raised hens.',
    price: 5.25,
    unit: 'dozen',
    image:
      'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?auto=format&fit=crop&w=600&q=70',
  },
  {
    _id: 'g-5',
    title: 'Avocado',
    description: 'Hass variety, perfect for toast.',
    price: 1.75,
    unit: 'each',
    image:
      'https://images.unsplash.com/photo-1601039641847-7857b994d704?auto=format&fit=crop&w=600&q=70',
  },
  {
    _id: 'g-6',
    title: 'Organic Spinach',
    description: 'Tender baby leaves, washed & ready.',
    price: 3.4,
    unit: '5 oz bag',
    image:
      'https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=600&q=70',
    tag: 'Organic',
  },
  {
    _id: 'g-7',
    title: 'Honeycrisp Apples',
    description: 'Crisp, sweet, family orchard picked.',
    price: 2.99,
    unit: 'per lb',
    image:
      'https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?auto=format&fit=crop&w=600&q=70',
  },
  {
    _id: 'g-8',
    title: 'Greek Yogurt',
    description: 'Plain, whole milk, probiotic.',
    price: 4.8,
    unit: '32 oz',
    image:
      'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=600&q=70',
  },
];

export default function Home() {
  const { data: products, isLoading } = useAllProducts(12);
  const { data: categories = [] } = useCategories();
  const groceryCategory = categories.find(
    (c) => c.slug === 'groceries' || c.name.toLowerCase() === 'groceries',
  );
  const groceryHref = groceryCategory
    ? `/category/${groceryCategory.slug}`
    : '/shop';

  return (
    <div className="space-y-16">
      <Helmet>
        <title>Shopper — Home</title>
      </Helmet>
      <section className="container relative overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/10 via-primary/5 to-background px-6 py-20 text-center shadow-sm md:py-28">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,theme(colors.primary/10),transparent_60%)]" />
        <span className="inline-flex items-center rounded-full border bg-background/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
          ✨ New season — hand-picked favorites
        </span>
        <h1 className="mt-5 text-balance text-4xl font-bold tracking-tight md:text-6xl">
          Discover. Shop. Smile.
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-pretty text-base text-muted-foreground md:text-lg">
          Browse our curated collection of premium products — electronics,
          accessories and more — shipped to your door.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
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
      </section>

      {categories.length > 0 && (
        <section className="container space-y-6">
          <div className="flex items-end justify-between">
            <h2 className="text-2xl font-semibold">Shop by category</h2>
            <Button asChild variant="link" className="hidden sm:inline-flex">
              <Link to="/shop">View all</Link>
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {categories.slice(0, 8).map((c) => (
              <Link
                key={c._id}
                to={`/category/${c.slug}`}
                className="group relative flex items-center justify-between rounded-xl border bg-card p-5 text-sm font-medium shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <span className="truncate">{c.name}</span>
                <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100 group-hover:text-primary" />
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="container space-y-6">
        <div className="flex items-end justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary ring-1 ring-primary/20">
              <ShoppingBasket className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-2xl font-semibold">Fresh groceries</h2>
              <p className="text-sm text-muted-foreground">
                Daily essentials delivered to your door.
              </p>
            </div>
          </div>
          <Button asChild variant="link" className="group">
            <Link to={groceryHref}>
              View all
              <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {GROCERIES.map((g) => (
            <div
              key={g._id}
              className="group overflow-hidden rounded-xl border bg-card shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md focus-within:ring-2 focus-within:ring-ring"
            >
              <div className="relative aspect-square overflow-hidden bg-muted">
                <img
                  src={g.image}
                  alt={g.title}
                  loading="lazy"
                  className="h-full w-full object-cover transition duration-500 ease-out group-hover:scale-105"
                />
                {g.tag && (
                  <span className="absolute left-2 top-2 rounded-full bg-primary/90 px-2.5 py-0.5 text-xs font-medium text-primary-foreground shadow-sm backdrop-blur">
                    {g.tag}
                  </span>
                )}
              </div>
              <div className="space-y-1 p-4">
                <h3 className="line-clamp-1 font-medium">{g.title}</h3>
                <p className="line-clamp-2 text-xs text-muted-foreground">
                  {g.description}
                </p>
                <div className="flex items-baseline gap-1 pt-1">
                  <span className="text-base font-semibold">
                    ${g.price.toFixed(2)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    / {g.unit}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="container space-y-6">
        <div className="flex items-end justify-between">
          <h2 className="text-2xl font-semibold">Newest arrivals</h2>
          <Button asChild variant="link" className="group">
            <Link to="/shop">
              View all
              <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </Button>
        </div>
        {isLoading ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square w-full" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {(products ?? []).map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}