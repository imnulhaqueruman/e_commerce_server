import { useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { toast } from 'sonner';
import { Button } from '@/shared/ui/primitives/button';
import { Input } from '@/shared/ui/primitives/input';
import { Label } from '@/shared/ui/primitives/label';
import { Select } from '@/shared/ui/primitives/select';
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
  useCreateSub,
  useDeleteSub,
  useSubs,
  useUpdateSub,
} from '@/features/catalog/api/categories';
import type { Category, Sub } from '@/shared/types';

export default function Subs() {
  const { data: subs = [], isLoading } = useSubs();
  const { data: categories = [] } = useCategories();
  const createSub = useCreateSub();
  const updateSub = useUpdateSub();
  const deleteSub = useDeleteSub();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Sub | null>(null);
  const [name, setName] = useState('');
  const [parent, setParent] = useState('');
  const [pendingDelete, setPendingDelete] = useState<Sub | null>(null);

  const parentName = (sub: Sub) => {
    if (typeof sub.parent === 'string') {
      return categories.find((c) => c._id === sub.parent)?.name ?? '—';
    }
    return sub.parent?.name ?? '—';
  };

  const openCreate = () => {
    setEditing(null);
    setName('');
    setParent(categories[0]?._id ?? '');
    setDialogOpen(true);
  };

  const openEdit = (sub: Sub) => {
    setEditing(sub);
    setName(sub.name);
    setParent(typeof sub.parent === 'string' ? sub.parent : sub.parent?._id ?? '');
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
    if (!parent) {
      toast.error('Choose a parent category');
      return;
    }

    const options = {
      onSuccess: () => {
        toast.success(editing ? 'Sub category updated' : 'Sub category created');
        closeDialog();
      },
      onError: (error: unknown) => {
        toast.error(
          error instanceof Error
            ? error.message
            : 'Could not save the sub category',
        );
      },
    };

    if (editing) {
      updateSub.mutate(
        { slug: editing.slug, payload: { name: name.trim(), parent } },
        options,
      );
    } else {
      createSub.mutate({ name: name.trim(), parent }, options);
    }
  };

  const handleDelete = () => {
    if (!pendingDelete) return;
    deleteSub.mutate(pendingDelete.slug, {
      onSuccess: () => {
        toast.success('Sub category deleted');
        setPendingDelete(null);
      },
      onError: (error) => {
        toast.error(
          error instanceof Error
            ? error.message
            : 'Could not delete the sub category',
        );
      },
    });
  };

  const pending =
    createSub.isPending || updateSub.isPending || deleteSub.isPending;

  return (
    <div className="section space-y-6">
      <Helmet>
        <title>Sub categories · Admin · Shopper</title>
      </Helmet>

      <PageHeader
        title="Sub categories"
        description="Sub categories belong to a parent category."
        actions={
          <Button onClick={openCreate} disabled={categories.length === 0}>
            <Plus className="mr-1.5 h-4 w-4" />
            New sub category
          </Button>
        }
      />

      {categories.length === 0 ? (
        <p className="rounded-xl border border-dashed px-6 py-10 text-center text-sm text-muted-foreground">
          Create a category first — a sub category needs a parent.
        </p>
      ) : (
        <DataTable
          columns={[
            {
              key: 'name',
              header: 'Name',
              render: (sub: Sub) => (
                <span className="font-medium">{sub.name}</span>
              ),
            },
            {
              key: 'parent',
              header: 'Parent category',
              render: (sub: Sub) => (
                <span className="text-muted-foreground">{parentName(sub)}</span>
              ),
            },
            {
              key: 'slug',
              header: 'Slug',
              render: (sub: Sub) => (
                <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                  {sub.slug}
                </code>
              ),
            },
            {
              key: 'actions',
              header: '',
              className: 'text-right',
              headerClassName: 'text-right',
              render: (sub: Sub) => (
                <div className="flex justify-end gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label={`Edit ${sub.name}`}
                    onClick={() => openEdit(sub)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon"
                    aria-label={`Delete ${sub.name}`}
                    onClick={() => setPendingDelete(sub)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ),
            },
          ]}
          rows={subs}
          loading={isLoading}
          emptyMessage="No sub categories yet."
        />
      )}

      <Dialog open={dialogOpen} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editing ? 'Edit sub category' : 'New sub category'}
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
              <Label htmlFor="sub-name">Name</Label>
              <Input
                id="sub-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Android"
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sub-parent">Parent category</Label>
              <Select
                id="sub-parent"
                value={parent}
                onChange={(e) => setParent(e.target.value)}
              >
                <option value="">Choose a category</option>
                {categories.map((category: Category) => (
                  <option key={category._id} value={category._id}>
                    {category.name}
                  </option>
                ))}
              </Select>
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={pending}>
                {pending
                  ? 'Saving…'
                  : editing
                    ? 'Save changes'
                    : 'Create sub category'}
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
        title="Delete this sub category?"
        description={
          pendingDelete
            ? `“${pendingDelete.name}” will be removed. Products keep a dangling reference to it.`
            : undefined
        }
        confirmLabel="Delete"
        destructive
        pending={deleteSub.isPending}
        onConfirm={handleDelete}
      />
    </div>
  );
}
