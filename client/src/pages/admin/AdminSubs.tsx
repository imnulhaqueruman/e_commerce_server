import { useState } from 'react';
import {
  useSubs,
  useCreateSub,
  useDeleteSub,
  useCategories,
} from '@/api/categories';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Trash2, Plus } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function AdminSubs() {
  const { data: subs, isLoading } = useSubs();
  const { data: categories } = useCategories();
  const create = useCreateSub();
  const remove = useDeleteSub();
  const [name, setName] = useState('');
  const [parent, setParent] = useState('');

  const onCreate = () => {
    if (!name.trim() || !parent) {
      toast.error('Pick a category and name');
      return;
    }
    create.mutate(
      { name, parent },
      {
        onSuccess: () => {
          setName('');
          toast.success('Sub created');
        },
      },
    );
  };

  return (
    <div className="container py-8">
      <h1 className="mb-6 text-2xl font-semibold">Subcategories</h1>

      <Card className="mb-6">
        <CardContent className="grid gap-3 p-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label>Category</Label>
            <select
              value={parent}
              onChange={(e) => setParent(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">Select…</option>
              {(categories ?? []).map((c: any) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label>Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Laptops"
            />
          </div>
          <div className="flex items-end">
            <Button onClick={onCreate} disabled={create.isPending} className="w-full">
              <Plus className="mr-1 h-4 w-4" />
              Add sub
            </Button>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : (
        <div className="grid gap-3">
          {(subs ?? []).map((s: any) => (
            <Card key={s._id}>
              <CardContent className="flex items-center gap-4 p-4">
                <span className="flex-1 font-medium">{s.name}</span>
                <span className="text-xs text-muted-foreground">
                  /{s.parent?.name ?? '—'}
                </span>
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => {
                    if (confirm(`Delete "${s.name}"?`)) {
                      remove.mutate(s._id, {
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