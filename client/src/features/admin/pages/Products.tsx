import { useState } from 'react';
import { Package, Pencil, Plus, Trash2 } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { toast } from 'sonner';
import { Button } from '@/shared/ui/primitives/button';
import { Input } from '@/shared/ui/primitives/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/primitives/dialog';
import { DataTable } from '@/shared/ui/DataTable';
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog';
import { PageHeader } from '@/shared/ui';
import { ProductForm } from '@/features/admin/components/ProductForm';
import {
  useDeleteProduct,
  useProducts,
} from '@/features/catalog/api/products';
import { useProduct } from '@/features/catalog/api/products';
import { formatCurrency, primaryImage } from '@/shared/lib/format';
import type { Product } from '@/shared/types';

export default function Products() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Product | null>(null);

  const { data, isLoading } = useProducts({ page, perPage: 12 });
  const deleteProduct = useDeleteProduct();

  const items = (data?.items ?? []).filter((product) =>
    product.title?.toLowerCase().includes(search.toLowerCase()),
  );

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingSlug(null);
  };

  const handleDelete = () => {
    if (!pendingDelete) return;
    deleteProduct.mutate(pendingDelete.slug, {
      onSuccess: () => {
        toast.success('Product deleted');
        setPendingDelete(null);
      },
      onError: (error) => {
        toast.error(
          error instanceof Error ? error.message : 'Could not delete the product',
        );
      },
    });
  };

  return (
    <div className="section space-y-6">
      <Helmet>
        <title>Products · Admin · Shopper</title>
      </Helmet>

      <PageHeader
        title="Products"
        description="Manage the catalogue."
        actions={
          <>
            <Input
              placeholder="Search products…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search products"
              className="w-48"
            />
            <Button
              onClick={() => {
                setEditingSlug(null);
                setDialogOpen(true);
              }}
            >
              <Plus className="mr-1.5 h-4 w-4" />
              New product
            </Button>
          </>
        }
      />

      <DataTable
        columns={[
          {
            key: 'product',
            header: 'Product',
            render: (product: Product) => (
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 shrink-0 overflow-hidden rounded-md bg-muted">
                  {primaryImage(product.images) ? (
                    <img
                      src={primaryImage(product.images)}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground">
                      <Package className="h-4 w-4" />
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-medium">{product.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {product.brand ?? 'No brand'} · {product.color ?? 'Any colour'}
                  </p>
                </div>
              </div>
            ),
          },
          {
            key: 'price',
            header: 'Price',
            render: (product: Product) => (
              <span className="font-medium">{formatCurrency(product.price)}</span>
            ),
          },
          {
            key: 'stock',
            header: 'Stock',
            render: (product: Product) => (
              <span
                className={
                  product.quantity === 0 ? 'text-destructive' : undefined
                }
              >
                {product.quantity ?? 0}
              </span>
            ),
          },
          {
            key: 'sold',
            header: 'Sold',
            render: (product: Product) => <span>{product.sold ?? 0}</span>,
          },
          {
            key: 'actions',
            header: '',
            className: 'text-right',
            headerClassName: 'text-right',
            render: (product: Product) => (
              <div className="flex justify-end gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  aria-label={`Edit ${product.title}`}
                  onClick={() => {
                    setEditingSlug(product.slug);
                    setDialogOpen(true);
                  }}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="destructive"
                  size="icon"
                  aria-label={`Delete ${product.title}`}
                  onClick={() => setPendingDelete(product)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ),
          },
        ]}
        rows={items}
        loading={isLoading}
        emptyMessage={
          search ? 'No products match your search.' : 'No products yet.'
        }
      />

      {data && data.totalPages > 1 ? (
        <div className="flex items-center justify-between border-t pt-4">
          <p className="text-sm text-muted-foreground">
            Page {data.page} of {data.totalPages} · {data.total} products
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= data.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      ) : null}

      <Dialog open={dialogOpen} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {editingSlug ? 'Edit product' : 'New product'}
            </DialogTitle>
          </DialogHeader>
          {dialogOpen ? (
            <ProductFormLoader slug={editingSlug} onDone={closeDialog} />
          ) : null}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title="Delete this product?"
        description={
          pendingDelete
            ? `“${pendingDelete.title}” will be removed from the catalogue. This cannot be undone.`
            : undefined
        }
        confirmLabel="Delete"
        destructive
        pending={deleteProduct.isPending}
        onConfirm={handleDelete}
      />
    </div>
  );
}

/**
 * Loads the product being edited, then renders the form.
 */
function ProductFormLoader({
  slug,
  onDone,
}: {
  slug: string | null;
  onDone: () => void;
}) {
  const { data: product, isLoading } = useProduct(slug ?? undefined);

  if (slug && !product && isLoading) {
    return (
      <div className="space-y-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    );
  }

  return <ProductForm initial={product} onDone={onDone} />;
}
