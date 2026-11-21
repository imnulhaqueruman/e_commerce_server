import { useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { toast } from 'sonner';
import { Button } from '@/shared/ui/primitives/button';
import { Input } from '@/shared/ui/primitives/input';
import { Label } from '@/shared/ui/primitives/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/primitives/dialog';
import { DataTable } from '@/shared/ui/DataTable';
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog';
import { PageHeader } from '@/shared/ui';
import {
  useCategories,
  useCreateCategory,
  useDeleteCategory,
  useUpdateCategory,
} from '@/features/catalog/api/categories';
import { formatDate } from '@/shared/lib/format';
import type { Category } from '@/shared/types';

export default function Categories() {
  const { data: categories = [], isLoading } = useCategories();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [pendingDelete, setPendingDelete] = useState<Category | null>(null);

  const openCreate = () => {
    setEditing(null);
    setName('');
    setDialogOpen(true);
  };

  const openEdit = (category: Category) => {
    setEditing(category);
    setName(category.name);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditing(null);
  };

  const handleSubmit = () => {
    if (!name.trim()) {
      toast.error('A name is required');
      return;
    }

    const options = {
      onSuccess: () => {
        toast.success(editing ? 'Category updated' : 'Category created');
        closeDialog();
      },
      onError: (error: unknown) => {
        toast.error(
          error instanceof Error ? error.message : 'Could not save the category',
        );
      },
    };

    if (editing) {
      updateCategory.mutate({ slug: editing.slug, payload: { name: name.trim() } }, options);
    } else {
      createCategory.mutate({ name: name.trim() }, options);
    }
  };

  const handleDelete = () => {
    if (!pendingDelete) return;
    deleteCategory.mutate(pendingDelete.slug, {
      onSuccess: () => {
        toast.success('Category deleted');
        setPendingDelete(null);
      },
      onError: (error) => {
        toast.error(
          error instanceof Error ? error.message : 'Could not delete the category',
        );
      },
    });
  };

  const pending =
    createCategory.isPending ||
    updateCategory.isPending ||
    deleteCategory.isPending;

  return (
    <div className="section space-y-6">
      <Helmet>
        <title>Categories · Admin · Shopper</title>
      </Helmet>

      <PageHeader
        title="Categories"
        description="Top-level product categories. The slug is generated from the name."
        actions={
          <Button onClick={openCreate}>
            <Plus className="mr-1.5 h-4 w-4" />
            New category
          </Button>
        }
      />

      <DataTable
        columns={[
          {
            key: 'name',
            header: 'Name',
            render: (category: Category) => (
              <span className="font-medium">{category.name}</span>
            ),
          },
          {
            key: 'slug',
            header: 'Slug',
            render: (category: Category) => (
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                {category.slug}
              </code>
            ),
          },
          {
            key: 'created',
            header: 'Created',
            render: (category: Category) => (
              <span className="text-muted-foreground">
                {formatDate(category.createdAt)}
              </span>
            ),
          },
          {
            key: 'actions',
            header: '',
            className: 'text-right',
            headerClassName: 'text-right',
            render: (category: Category) => (
              <div className="flex justify-end gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  aria-label={`Edit ${category.name}`}
                  onClick={() => openEdit(category)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="destructive"
                  size="icon"
                  aria-label={`Delete ${category.name}`}
                  onClick={() => setPendingDelete(category)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ),
          },
        ]}
        rows={categories}
        loading={isLoading}
        emptyMessage="No categories yet."
      />

      <Dialog open={dialogOpen} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editing ? 'Edit category' : 'New category'}
            </DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="category-name">Name</Label>
              <Input
                id="category-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Laptops & PCs"
                autoFocus
              />
            </div>
            <p className="text-xs text-muted-foreground">
              The slug is generated from the name, so renaming a category
              changes its URL.
            </p>
            <div className="flex gap-2">
              <Button type="submit" disabled={pending}>
                {pending ? 'Saving…' : editing ? 'Save changes' : 'Create category'}
              </Button>
              <Button type="button" variant="outline" onClick={closeDialog}>
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title="Delete this category?"
        description={
          pendingDelete
            ? `“${pendingDelete.name}” will be removed. Products pointing at it keep a dangling reference.`
            : undefined
        }
        confirmLabel="Delete"
        destructive
        pending={deleteCategory.isPending}
        onConfirm={handleDelete}
      />
    </div>
  );
}
