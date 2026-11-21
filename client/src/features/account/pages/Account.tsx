import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Link } from 'react-router-dom';
import {
  Heart,
  MapPin,
  Package,
  ShoppingBag,
  Trash2,
  User as UserIcon,
} from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { toast } from 'sonner';
import { Button } from '@/shared/ui/primitives/button';
import { Input } from '@/shared/ui/primitives/input';
import { Label } from '@/shared/ui/primitives/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/primitives/tabs';
import { Textarea } from '@/shared/ui/primitives/textarea';
import { StatusBadge } from '@/shared/ui/StatusBadge';
import { EmptyState } from '@/shared/ui';
import {
  useOrders,
  useRemoveFromWishlist,
  useUpdateProfile,
  useWishlist,
} from '@/features/account/api/account';
import { useAuthStore } from '@/features/auth/store/authStore';
import {
  formatCurrency,
  formatDate,
  primaryImage,
  orderReference,
} from '@/shared/lib/format';

/**
 * The signed-in user's account area: profile, orders, wishlist, address.
 *
 * The active tab is driven by `?tab=` so the navbar's wishlist link can
 * deep-link into it.
 */
export default function Account() {
  const [params, setParams] = useSearchParams();
  const user = useAuthStore((s) => s.user);
  const updateProfile = useUpdateProfile();
  const { data: orders, isLoading: ordersLoading } = useOrders();
  const { data: wishlist = [], isLoading: wishlistLoading } = useWishlist();
  const removeFromWishlist = useRemoveFromWishlist();

  const tab = params.get('tab') ?? 'profile';

  const [name, setName] = useState(user?.name ?? '');
  const [address, setAddress] = useState(user?.address ?? '');

  useEffect(() => {
    setName(user?.name ?? '');
    setAddress(user?.address ?? '');
  }, [user]);

  const setTab = (value: string) => {
    const next = new URLSearchParams(params);
    next.set('tab', value);
    setParams(next, { replace: true });
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProfile.mutateAsync({ name });
      toast.success('Profile updated');
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Could not save your profile',
      );
    }
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProfile.mutateAsync({ address });
      toast.success('Address saved');
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Could not save your address',
      );
    }
  };

  const handleRemove = async (productId: string) => {
    try {
      await removeFromWishlist.mutateAsync(productId);
      toast.success('Removed from wishlist');
    } catch {
      toast.error('Could not update your wishlist');
    }
  };

  if (!user) return null;

  return (
    <div className="section space-y-6">
      <Helmet>
        <title>My account · Shopper</title>
      </Helmet>

      <div>
        <h1 className="text-3xl font-semibold tracking-tight">My account</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Signed in as {user.email}
        </p>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="space-y-6">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="profile">
            <UserIcon className="mr-1.5 h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="orders">
            <ShoppingBag className="mr-1.5 h-4 w-4" />
            Orders
          </TabsTrigger>
          <TabsTrigger value="wishlist">
            <Heart className="mr-1.5 h-4 w-4" />
            Wishlist
          </TabsTrigger>
          <TabsTrigger value="address">
            <MapPin className="mr-1.5 h-4 w-4" />
            Address
          </TabsTrigger>
        </TabsList>

        {/* Profile */}
        <TabsContent value="profile">
          <form
            onSubmit={handleSaveProfile}
            className="max-w-md space-y-4 rounded-xl border bg-card p-6"
          >
            <h2 className="text-lg font-semibold">Profile</h2>

            <div className="space-y-2">
              <Label htmlFor="profile-name">Name</Label>
              <Input
                id="profile-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="profile-email">Email</Label>
              <Input id="profile-email" value={user.email} disabled readOnly />
            </div>

            <Button type="submit" disabled={updateProfile.isPending}>
              {updateProfile.isPending ? 'Saving…' : 'Save changes'}
            </Button>
          </form>
        </TabsContent>

        {/* Orders */}
        <TabsContent value="orders">
          {ordersLoading ? (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-20 animate-pulse rounded-xl bg-muted" />
              ))}
            </div>
          ) : !orders || orders.length === 0 ? (
            <EmptyState
              icon={<Package className="h-5 w-5" />}
              title="No orders yet"
              description="When you place an order it will show up here."
              action={
                <Button asChild>
                  <Link to="/shop">Start shopping</Link>
                </Button>
              }
            />
          ) : (
            <div className="space-y-3">
              {orders.map((order) => (
                <article
                  key={order._id}
                  className="rounded-xl border bg-card p-5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-medium">
                        {orderReference(order._id)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(order.createdAt)}
                      </p>
                    </div>
                    <StatusBadge status={order.orderStatus} />
                    <p className="font-semibold">
                      {formatCurrency(
                        order.paymentIntent?.amount
                          ? order.paymentIntent.amount / 100
                          : order.cartTotal ?? 0,
                      )}
                    </p>
                  </div>

                  {order.products?.length ? (
                    <ul className="mt-4 flex flex-wrap gap-2 border-t pt-4">
                      {order.products.map((item, index) => (
                        <li
                          key={index}
                          className="rounded-md bg-muted px-2.5 py-1 text-xs text-muted-foreground"
                        >
                          {typeof item.product === 'string'
                            ? 'Product'
                            : item.product.title}{' '}
                          × {item.count}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </article>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Wishlist */}
        <TabsContent value="wishlist">
          {wishlistLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-64 animate-pulse rounded-xl bg-muted" />
              ))}
            </div>
          ) : wishlist.length === 0 ? (
            <EmptyState
              icon={<Heart className="h-5 w-5" />}
              title="Your wishlist is empty"
              description="Tap the heart on any product to save it for later."
              action={
                <Button asChild>
                  <Link to="/shop">Browse products</Link>
                </Button>
              }
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {wishlist.map((product) => (
                <article
                  key={product._id}
                  className="overflow-hidden rounded-xl border bg-card"
                >
                  <Link to={`/product/${product.slug}`}>
                    <div className="aspect-square overflow-hidden bg-muted">
                      {primaryImage(product.images) ? (
                        <img
                          src={primaryImage(product.images)}
                          alt={product.title}
                          loading="lazy"
                          className="h-full w-full object-cover"
                        />
                      ) : null}
                    </div>
                  </Link>
                  <div className="space-y-2 p-4">
                    <Link
                      to={`/product/${product.slug}`}
                      className="line-clamp-1 font-medium hover:underline"
                    >
                      {product.title}
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      {formatCurrency(product.price)}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => handleRemove(product._id)}
                    >
                      <Trash2 className="mr-1.5 h-4 w-4" />
                      Remove
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Address */}
        <TabsContent value="address">
          <form
            onSubmit={handleSaveAddress}
            className="max-w-md space-y-4 rounded-xl border bg-card p-6"
          >
            <h2 className="text-lg font-semibold">Shipping address</h2>
            <div className="space-y-2">
              <Label htmlFor="account-address">Address</Label>
              <Textarea
                id="account-address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="123 Main St, City, State, ZIP"
                rows={4}
              />
            </div>
            <Button type="submit" disabled={updateProfile.isPending}>
              {updateProfile.isPending ? 'Saving…' : 'Save address'}
            </Button>
          </form>
        </TabsContent>
      </Tabs>
    </div>
  );
}
