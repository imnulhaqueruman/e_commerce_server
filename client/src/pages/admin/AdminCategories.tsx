import { useState } from 'react';
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from '@/api/categories';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Pencil, Trash2, Plus } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function AdminCategories() {
  const { data, isLoading } = useCategories();
  const create = useCreateCategory();
  const update = useUpdateCategory();
  const remove = useDeleteCategory();
  const [name, setName] = useState('');
  const [editing, setEditing] = useState<{ id: string; name: string } | null>(null);

  const onCreate = () => {
    if (!name.trim()) return;
    create.mutate(
      { name },
      { onSuccess: () => { setName(''); toast.success('Category created'); } },
    );
  };

  return (
    <div className="container py-8">
      <h1 className="mb-6 text-2xl font-semibold">Categories</h1>

      <Card className="mb-6">
        <CardContent className="flex items-end gap-2 p-4">
          <div className="flex-1 space-y-2">
            <Label htmlFor="cat-name">New category</Label>
            <Input
              id="cat-name"
              value={editing?.name ?? name}
              onChange={(e) =>
                editing
                  ? setEditing({ ...editing, name: e.target.value })
                  : setName(e.target.value)
              }
              placeholder="e.g. Electronics"
            />
          </div>
          {editing ? (
            <>
              <Button
                onClick={() => {
                  update.mutate(
                    { slug: editing.id, payload: { name: editing.name } },
                    {
                      onSuccess: () => {
                        setEditing(null);
                        setName('');
                        toast.success('Updated');
                      },
                    },
                  );
                }}
              >
                Save
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setEditing(null);
                  setName('');
                }}
              >
                Cancel
              </Button>
            </>
          ) : (
            <Button onClick={onCreate} disabled={create.isPending}>
              <Plus className="mr-1 h-4 w-4" />
              Add
            </Button>
          )}
        </CardContent>
      </Card>

      {isLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : (
        <div className="grid gap-3">
          {(data ?? []).map((c: any) => (
            <Card key={c._id}>
              <CardContent className="flex items-center gap-4 p-4">
                <span className="flex-1 font-medium">{c.name}</span>
                <span className="text-xs text-muted-foreground">/{c.slug}</span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setEditing({ id: c.slug, name: c.name })}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => {
                    if (confirm(`Delete "${c.name}"?`)) {
                      remove.mutate(c.slug, {
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
    </div>
  );
}