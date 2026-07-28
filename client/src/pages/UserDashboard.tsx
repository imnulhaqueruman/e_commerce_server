import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuthStore } from '@/store/authStore';
import { useOrders, useUpdateProfile, useWishlist, useRemoveFromWishlist } from '@/api/user';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency, formatDate } from '@/lib/format';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Trash2 } from 'lucide-react';

type ProfileValues = {
  name: string;
  email: string;
  address?: string;
};

export default function UserDashboard() {
  const user = useAuthStore((s) => s.user);
  const setAuth = useAuthStore((s) => s.setAuth);
  const token = useAuthStore((s) => s.token);

  const updateProfile = useUpdateProfile();
  const { data: orders, isLoading: ordersLoading } = useOrders();
  const { data: wishlist, isLoading: wishlistLoading } = useWishlist();
  const removeFromWishlist = useRemoveFromWishlist();

  const [address, setAddress] = useState('');

  const { register, handleSubmit, reset } = useForm<ProfileValues>({
    defaultValues: { name: user?.name ?? '', email: user?.email ?? '' },
  });

  useEffect(() => {
    if (user) reset({ name: user.name ?? '', email: user.email ?? '' });
  }, [user, reset]);

  useEffect(() => {
    setAddress((user as any)?.address ?? '');
  }, [user]);

  if (!user) return null;

  const onSaveProfile = (values: ProfileValues) => {
    updateProfile.mutate(
      { name: values.name },
      {
        onSuccess: (res: any) => {
          const updated = res.user ?? res;
          setAuth({ user: { ...user, ...updated }, token: token! });
          toast.success('Profile updated');
        },
        onError: (err: any) =>
          toast.error(err?.response?.data?.err ?? 'Update failed'),
      },
    );
  };

  const onSaveAddress = () => {
    updateProfile.mutate(
      { address },
      {
        onSuccess: (res: any) => {
          const updated = res.user ?? res;
          setAuth({ user: { ...user, ...updated }, token: token! });
          toast.success('Address saved');
        },
        onError: (err: any) =>
          toast.error(err?.response?.data?.err ?? 'Save failed'),
      },
    );
  };

  return (
    <div className="container py-8">
      <Helmet>
        <title>My account · Shopper</title>
      </Helmet>
      <h1 className="mb-6 text-2xl font-semibold">My account</h1>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="wishlist">Wishlist</TabsTrigger>
          <TabsTrigger value="address">Address</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={handleSubmit(onSaveProfile)}
                className="max-w-md space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" {...register('name')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" disabled {...register('email')} />
                </div>
                <Button type="submit" disabled={updateProfile.isPending}>
                  {updateProfile.isPending ? 'Saving…' : 'Save changes'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders">
          {ordersLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : !orders || orders.length === 0 ? (
            <p className="text-sm text-muted-foreground">No orders yet.</p>
          ) : (
            <div className="space-y-3">
              {orders.map((o: any) => (
                <Card key={o._id}>
                  <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                    <div>
                      <p className="text-sm font-medium">#{o._id.slice(-6).toUpperCase()}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(o.createdAt)}
                      </p>
                    </div>
                    <div className="text-sm">
                      <span className="rounded-full border px-2 py-0.5 text-xs">
                        {o.orderStatus ?? 'processing'}
                      </span>
                    </div>
                    <div className="text-sm font-semibold">
                      {formatCurrency(
                        o.cartTotal ?? o.paymentIntent?.amount ?? 0,
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="wishlist">
          {wishlistLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : !wishlist || wishlist.length === 0 ? (
            <p className="text-sm text-muted-foreground">No items in wishlist.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {wishlist.map((p: any) => (
                <Card key={p._id}>
                  <CardContent className="p-3">
                    <Link to={`/product/${p.slug}`} className="block">
                      <img
                        src={p.images?.[0]?.url}
                        alt={p.title}
                        className="h-32 w-full rounded object-cover"
                      />
                      <p className="mt-2 text-sm font-medium line-clamp-1">
                        {p.title}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatCurrency(p.price)}
                      </p>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2 w-full"
                      onClick={() =>
                        removeFromWishlist.mutate(p._id, {
                          onSuccess: () => toast.success('Removed'),
                        })
                      }
                    >
                      <Trash2 className="mr-1 h-4 w-4" />
                      Remove
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="address">
          <Card>
            <CardHeader>
              <CardTitle>Shipping address</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-w-md space-y-3">
                <textarea
                  className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="123 Main St, City, State, ZIP"
                />
                <Button
                  onClick={onSaveAddress}
                  disabled={updateProfile.isPending}
                >
                  Save address
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}