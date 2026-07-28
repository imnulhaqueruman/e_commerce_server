import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Sheet } from '@/components/ui/sheet';
import { useCategories } from '@/api/categories';
import { useCategorySubs } from '@/api/categories';

export interface ProductFilterValues {
  query?: string;
  price?: [number, number];
  category?: string;
  sub?: string;
  color?: string;
  brand?: string;
  rating?: number;
  shipping?: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  values: ProductFilterValues;
  onApply: (values: ProductFilterValues) => void;
}

const COLORS = ['Black', 'Brown', 'Silver', 'White', 'Blue'];
const BRANDS = ['Apple', 'Samsung', 'Microsoft', 'Lenovo', 'ASUS'];

export function FilterDrawer({ open, onOpenChange, values, onApply }: Props) {
  const { data: categories = [] } = useCategories();
  const { data: subs = [] } = useCategorySubs(values.category);
  const [local, setLocal] = useState<ProductFilterValues>(values);

  return (
    <Sheet open={open} onOpenChange={onOpenChange} side="left">
      <div className="space-y-6">
        <h2 className="text-lg font-semibold">Filters</h2>
        <div className="space-y-2">
          <Label>Search</Label>
          <Input
            value={local.query ?? ''}
            onChange={(e) => setLocal({ ...local, query: e.target.value })}
            placeholder="Keyword…"
          />
        </div>
        <div className="space-y-2">
          <Label>Price range</Label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              value={local.price?.[0] ?? 0}
              onChange={(e) =>
                setLocal({
                  ...local,
                  price: [Number(e.target.value), local.price?.[1] ?? 0],
                })
              }
            />
            <span>–</span>
            <Input
              type="number"
              value={local.price?.[1] ?? 0}
              onChange={(e) =>
                setLocal({
                  ...local,
                  price: [local.price?.[0] ?? 0, Number(e.target.value)],
                })
              }
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Category</Label>
          <Select
            value={local.category ?? ''}
            onChange={(e) =>
              setLocal({ ...local, category: e.target.value, sub: undefined })
            }
          >
            <option value="">All</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>
        {subs.length > 0 && (
          <div className="space-y-2">
            <Label>Sub category</Label>
            <Select
              value={local.sub ?? ''}
              onChange={(e) => setLocal({ ...local, sub: e.target.value })}
            >
              <option value="">All</option>
              {subs.map((s: any) => (
                <option key={s._id} value={s._id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </div>
        )}
        <div className="space-y-2">
          <Label>Color</Label>
          <Select
            value={local.color ?? ''}
            onChange={(e) => setLocal({ ...local, color: e.target.value })}
          >
            <option value="">Any</option>
            {COLORS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Brand</Label>
          <Select
            value={local.brand ?? ''}
            onChange={(e) => setLocal({ ...local, brand: e.target.value })}
          >
            <option value="">Any</option>
            {BRANDS.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Min. rating</Label>
          <Select
            value={String(local.rating ?? 0)}
            onChange={(e) =>
              setLocal({ ...local, rating: Number(e.target.value) })
            }
          >
            <option value="0">Any</option>
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {n} star{n > 1 ? 's' : ''}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex gap-2 pt-2">
          <Button
            onClick={() => {
              onApply({});
              setLocal({});
              onOpenChange(false);
            }}
            variant="outline"
            className="flex-1"
          >
            Reset
          </Button>
          <Button
            onClick={() => {
              onApply(local);
              onOpenChange(false);
            }}
            className="flex-1"
          >
            Apply
          </Button>
        </div>
      </div>
    </Sheet>
  );
}