import { useState } from 'react';
import {
  useAllProducts,
  useDeleteProduct,
  useProduct,
  useCreateProduct,
  useUpdateProduct,
} from '@/api/products';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import ProductForm from '@/components/ProductForm';
import { formatCurrency } from '@/lib/format';
import { Helmet } from 'react-helmet-async';
import { Pencil, Trash2, Plus } from 'lucide-react';
import { toast } from 'react-hot-toast';
import type { Product } from '@/types';

export default function AdminProducts() {
  const { data, isLoading } = useAllProducts();
  const deleteProduct = useDeleteProduct();
  const [open, setOpen] = useState(false);
  const [editSlug, setEditSlug] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const items = ((data ?? []) as Product[]).filter((p) =>
    p.title?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="container py-8">
      <Helmet>
        <title>Products · Admin · Shopper</title>
      </Helmet>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Products</h1>
        <div className="flex gap-2">
          <Input
            placeholder="Search…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-48"
          />
          <Button
            onClick={() => {
              setEditSlug(null);
              setOpen(true);
            }}
          >
            <Plus className="mr-1 h-4 w-4" />
            New product
          </Button>
        </div>
      </div>

      {isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <div className="grid gap-3">
          {items.map((p) => (
            <Card key={p._id}>
              <CardContent className="flex items-center gap-4 p-4">
                <img
                  src={(p.images ?? [])[0]}
                  alt={p.title}
                  className="h-14 w-14 rounded object-cover"
                />
                <div className="flex-1">
                  <p className="font-medium">{p.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatCurrency(p.price)} · {p.quantity ?? 0} in stock
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    setEditSlug(p.slug);
                    setOpen(true);
                  }}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => {
                    if (confirm(`Delete "${p.title}"?`)) {
                      deleteProduct.mutate(p.slug, {
                        onSuccess: () => toast.success('Deleted'),
                      });
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editSlug ? 'Edit product' : 'New product'}</DialogTitle>
          </DialogHeader>
          {open ? (
            <ProductFormDialog
              slug={editSlug}
              onDone={() => setOpen(false)}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ProductFormDialog({
  slug,
  onDone,
}: {
  slug: string | null;
  onDone: () => void;
}) {
  const { data: initial } = useProduct(slug ?? undefined);
  const create = useCreateProduct();
  const update = useUpdateProduct();

  if (slug && !initial) {
    return <Skeleton className="h-64 w-full" />;
  }

  return (
    <ProductForm
      initial={initial}
      submitting={create.isPending || update.isPending}
      onSubmit={(payload) => {
        if (slug) {
          update.mutate(
            { slug, payload },
            {
              onSuccess: () => {
                toast.success('Updated');
                onDone();
              },
            },
          );
        } else {
          create.mutate(payload, {
            onSuccess: () => {
              toast.success('Created');
              onDone();
            },
          });
        }
      }}
    />
  );
}