import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Check, Heart, Minus, PackageX, Plus, Star } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { toast } from 'sonner';
import { StarRating } from '@/components/StarRating';
import { Button } from '@/shared/ui/primitives/button';
import { Select } from '@/shared/ui/primitives/select';
import { Badge } from '@/shared/ui/primitives/badge';
import {
  useProduct,
  useRelatedProducts,
  useRateProduct,
} from '@/features/catalog/api/products';
import { useSaveCart } from '@/features/cart/api/cart';
import {
  useAddToWishlist,
  useRemoveFromWishlist,
  useWishlist,
} from '@/features/account/api/account';
import { useAuthStore } from '@/features/auth/store/authStore';
import {
  formatCurrency,
  averageRating,
  primaryImage,
  categoryName,
} from '@/shared/lib/format';

export default function ProductDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { token } = useAuthStore();

  const { data: product, isLoading, isError, refetch } = useProduct(slug);
  const { data: related = [] } = useRelatedProducts(product?._id);
  const rate = useRateProduct();
  const saveCart = useSaveCart();
  const { data: wishlist = [] } = useWishlist();
  const addToWishlist = useAddToWishlist();
  const removeFromWishlist = useRemoveFromWishlist();

  const [count, setCount] = useState(1);
  const [color, setColor] = useState('');
  const [activeImage, setActiveImage] = useState(0);

  if (isLoading) {
    return (
      <div className="section">
        <div className="grid gap-10 md:grid-cols-2">
          <div className="aspect-square animate-pulse rounded-xl bg-muted" />
          <div className="space-y-4">
            <div className="h-8 w-3/4 animate-pulse rounded bg-muted" />
            <div className="h-6 w-1/4 animate-pulse rounded bg-muted" />
            <div className="h-24 w-full animate-pulse rounded bg-muted" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="section flex flex-col items-center justify-center py-20 text-center">
        <PackageX className="h-10 w-10 text-muted-foreground" />
        <h1 className="mt-4 text-2xl font-semibold">Product not found</h1>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          This product may have been removed from the catalogue.
        </p>
        <div className="mt-6 flex gap-3">
          <Button onClick={() => refetch()}>Try again</Button>
          <Button asChild variant="outline">
            <Link to="/shop">Back to shop</Link>
          </Button>
        </div>
      </div>
    );
  }

  const rating = averageRating(product.ratings);
  const images = product.images ?? [];
  const isWished = wishlist.some((p) =>
    typeof p === 'string' ? p === product._id : p?._id === product._id,
  );
  const outOfStock = product.quantity === 0;

  const handleAddToCart = async () => {
    if (!token) {
      toast.error('Please sign in to add items to your cart');
      navigate('/login', { state: { from: { pathname: `/product/${slug}` } } });
      return;
    }

    if (!color && product.color) {
      toast.error('Please choose a colour first');
      return;
    }

    try {
      await saveCart.mutateAsync([
        { _id: product._id, count, color: color || product.color || '' },
      ]);
      toast.success('Added to your cart');
      navigate('/cart');
    } catch {
      toast.error('Could not add that to your cart');
    }
  };

  const handleToggleWishlist = async () => {
    if (!token) {
      toast.error('Please sign in to use the wishlist');
      return;
    }
    try {
      if (isWished) {
        await removeFromWishlist.mutateAsync(product._id);
        toast.success('Removed from wishlist');
      } else {
        await addToWishlist.mutateAsync(product._id);
        toast.success('Added to wishlist');
      }
    } catch {
      toast.error('Could not update your wishlist');
    }
  };

  const handleRating = async (star: number) => {
    if (!token) {
      toast.error('Please sign in to rate this product');
      return;
    }
    try {
      await rate.mutateAsync({ productId: product._id, star });
      toast.success('Thanks for rating');
    } catch {
      toast.error('Could not save your rating');
    }
  };

  return (
    <div className="section">
      <Helmet>
        <title>{product.title} · Shopper</title>
        <meta name="description" content={product.description?.slice(0, 155)} />
      </Helmet>

      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-muted-foreground">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link to="/" className="hover:text-foreground">
              Home
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link to="/shop" className="hover:text-foreground">
              Shop
            </Link>
          </li>
          {categoryName(product.category) ? (
            <>
              <li aria-hidden="true">/</li>
              <li>
                <Link
                  to={`/category/${
                    typeof product.category === 'string'
                      ? product.category
                      : product.category.slug
                  }`}
                  className="hover:text-foreground"
                >
                  {categoryName(product.category)}
                </Link>
              </li>
            </>
          ) : null}
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="truncate text-foreground">
            {product.title}
          </li>
        </ol>
      </nav>

      <div className="grid gap-10 md:grid-cols-2">
        {/* Gallery */}
        <div className="space-y-4">
          <div className="overflow-hidden rounded-xl border bg-muted">
            {images[activeImage] ? (
              <img
                src={images[activeImage]}
                alt={product.title}
                className="aspect-square w-full object-cover"
              />
            ) : (
              <div className="flex aspect-square flex-col items-center justify-center gap-2 text-muted-foreground">
                <PackageX className="h-10 w-10" />
                <span className="text-sm">No image</span>
              </div>
            )}
          </div>

          {images.length > 1 ? (
            <div className="flex gap-3">
              {images.map((image, index) => (
                <button
                  key={image}
                  type="button"
                  onClick={() => setActiveImage(index)}
                  aria-label={`View image ${index + 1}`}
                  aria-current={index === activeImage}
                  className={`overflow-hidden rounded-lg border-2 transition-colors ${
                    index === activeImage
                      ? 'border-primary'
                      : 'border-transparent hover:border-border'
                  }`}
                >
                  <img
                    src={image}
                    alt=""
                    className="h-16 w-16 object-cover"
                  />
                </button>
              ))}
            </div>
          ) : null}
        </div>

        {/* Details */}
        <div className="space-y-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              {product.brand ? <Badge variant="secondary">{product.brand}</Badge> : null}
              {product.shipping === 'Yes' ? (
                <Badge className="bg-success/15 text-success">In stock</Badge>
              ) : null}
              {outOfStock ? (
                <Badge variant="destructive">Out of stock</Badge>
              ) : null}
            </div>

            <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
              {product.title}
            </h1>

            <p className="text-3xl font-bold">{formatCurrency(product.price)}</p>

            <div className="flex items-center gap-2">
              <StarRating value={rating} readOnly />
              <span className="text-sm text-muted-foreground">
                {rating.toFixed(1)} · {product.ratings?.length ?? 0} review
                {(product.ratings?.length ?? 0) === 1 ? '' : 's'}
              </span>
            </div>
          </div>

          <p className="whitespace-pre-line leading-relaxed text-muted-foreground">
            {product.description}
          </p>

          <div className="space-y-4 rounded-xl border bg-card p-5">
            {product.color ? (
              <div className="space-y-2">
                <label
                  htmlFor="product-color"
                  className="text-sm font-medium"
                >
                  Colour
                </label>
                <Select
                  id="product-color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="max-w-[200px]"
                >
                  <option value="">Choose a colour</option>
                  <option value={product.color}>{product.color}</option>
                </Select>
              </div>
            ) : null}

            <div className="space-y-2">
              <span className="text-sm font-medium">Quantity</span>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCount((c) => Math.max(1, c - 1))}
                  disabled={count <= 1}
                  aria-label="Decrease quantity"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-8 text-center font-medium">{count}</span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCount((c) => c + 1)}
                  disabled={product.quantity !== undefined && count >= product.quantity}
                  aria-label="Increase quantity"
                >
                  <Plus className="h-4 w-4" />
                </Button>
                {product.quantity !== undefined ? (
                  <span className="text-xs text-muted-foreground">
                    {product.quantity} available
                  </span>
                ) : null}
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                onClick={handleAddToCart}
                disabled={saveCart.isPending || outOfStock}
                className="flex-1"
              >
                {saveCart.isPending
                  ? 'Adding…'
                  : outOfStock
                    ? 'Out of stock'
                    : 'Add to cart'}
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleToggleWishlist}
                aria-label={isWished ? 'Remove from wishlist' : 'Add to wishlist'}
                aria-pressed={isWished}
              >
                <Heart
                  className={
                    isWished ? 'h-5 w-5 fill-red-500 text-red-500' : 'h-5 w-5'
                  }
                />
              </Button>
            </div>
          </div>

          {token ? (
            <div className="rounded-xl border bg-card p-5">
              <p className="mb-3 flex items-center gap-2 text-sm font-medium">
                <Star className="h-4 w-4" />
                Rate this product
              </p>
              <StarRating onChange={handleRating} />
            </div>
          ) : null}
        </div>
      </div>

      {/* Related */}
      {related.length > 0 ? (
        <section className="mt-16 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">You might also like</h2>
            <Link
              to="/shop"
              className="text-sm font-medium text-primary hover:underline"
            >
              View all
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {related.map((item) => (
              <Link
                key={item._id}
                to={`/product/${item.slug}`}
                className="group overflow-hidden rounded-xl border bg-card transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="aspect-square overflow-hidden bg-muted">
                  {primaryImage(item.images) ? (
                    <img
                      src={primaryImage(item.images)}
                      alt={item.title}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground">
                      <PackageX className="h-8 w-8" />
                    </div>
                  )}
                </div>
                <div className="space-y-1 p-4">
                  <p className="line-clamp-2 text-sm font-medium">{item.title}</p>
                  <p className="text-sm font-semibold">
                    {formatCurrency(item.price)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {color && product.color ? (
        <p className="sr-only" aria-live="polite">
          <Check className="inline h-3 w-3" /> Colour {color} selected
        </p>
      ) : null}
    </div>
  );
}
