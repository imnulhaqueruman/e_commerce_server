import { useEffect, useState } from 'react';
import { Filter, X } from 'lucide-react';
import { Button } from '@/shared/ui/primitives/button';
import { Input } from '@/shared/ui/primitives/input';
import { Label } from '@/shared/ui/primitives/label';
import { Select } from '@/shared/ui/primitives/select';
import {
  PRODUCT_BRANDS,
  PRODUCT_COLORS,
  type ProductFilters,
} from '@/shared/types';
import { useCategories, useCategorySubs } from '@/features/catalog/api/categories';

/**
 * The catalogue filter panel.
 *
 * Every filter is optional. The panel is a controlled component — the
 * parent owns the filter state (so it can serialise it into the URL) and
 * applies changes when the user presses "Apply".
 */
export function FilterPanel({
  values,
  onApply,
  onReset,
  className,
}: {
  values: ProductFilters;
  onApply: (values: ProductFilters) => void;
  onReset?: () => void;
  className?: string;
}) {
  const { data: categories = [] } = useCategories();
  const { data: subs = [] } = useCategorySubs(values.category);
  const [local, setLocal] = useState<ProductFilters>(values);

  // Keep the local draft in sync when the parent resets the filters.
  useEffect(() => {
    setLocal(values);
  }, [values]);

  const update = (patch: Partial<ProductFilters>) =>
    setLocal((prev) => ({ ...prev, ...patch }));

  const activeCount = Object.values(values).filter(
    (value) => value !== undefined && value !== '' && value !== null,
  ).length;

  return (
    <div className={className}>
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <Filter className="h-4 w-4" />
          Filters
          {activeCount > 0 ? (
            <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">
              {activeCount}
            </span>
          ) : null}
        </h2>
        {onReset && activeCount > 0 ? (
          <Button variant="ghost" size="sm" onClick={onReset}>
            <X className="mr-1 h-3.5 w-3.5" />
            Clear
          </Button>
        ) : null}
      </div>

      <div className="mt-6 space-y-6">
        <div className="space-y-2">
          <Label htmlFor="filter-query">Keyword</Label>
          <Input
            id="filter-query"
            value={local.query ?? ''}
            onChange={(e) => update({ query: e.target.value })}
            placeholder="Search the catalogue…"
          />
        </div>

        <div className="space-y-2">
          <Label>Price range</Label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={0}
              aria-label="Minimum price"
              value={local.price?.[0] ?? ''}
              onChange={(e) =>
                update({
                  price: [
                    e.target.value === '' ? 0 : Number(e.target.value),
                    local.price?.[1] ?? 0,
                  ],
                })
              }
              placeholder="Min"
            />
            <span className="text-muted-foreground">–</span>
            <Input
              type="number"
              min={0}
              aria-label="Maximum price"
              value={local.price?.[1] ?? ''}
              onChange={(e) =>
                update({
                  price: [
                    local.price?.[0] ?? 0,
                    e.target.value === '' ? 0 : Number(e.target.value),
                  ],
                })
              }
              placeholder="Max"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="filter-category">Category</Label>
          <Select
            id="filter-category"
            value={local.category ?? ''}
            onChange={(e) =>
              update({
                category: e.target.value || undefined,
                sub: undefined,
              })
            }
          >
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category._id} value={category._id}>
                {category.name}
              </option>
            ))}
          </Select>
        </div>

        {subs.length > 0 ? (
          <div className="space-y-2">
            <Label htmlFor="filter-sub">Sub category</Label>
            <Select
              id="filter-sub"
              value={local.sub ?? ''}
              onChange={(e) =>
                update({ sub: e.target.value || undefined })
              }
            >
              <option value="">All sub categories</option>
              {subs.map((sub) => (
                <option key={sub._id} value={sub._id}>
                  {sub.name}
                </option>
              ))}
            </Select>
          </div>
        ) : null}

        <div className="space-y-2">
          <Label htmlFor="filter-brand">Brand</Label>
          <Select
            id="filter-brand"
            value={local.brand ?? ''}
            onChange={(e) => update({ brand: e.target.value || undefined })}
          >
            <option value="">Any brand</option>
            {PRODUCT_BRANDS.map((brand) => (
              <option key={brand} value={brand}>
                {brand}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="filter-color">Colour</Label>
          <Select
            id="filter-color"
            value={local.color ?? ''}
            onChange={(e) => update({ color: e.target.value || undefined })}
          >
            <option value="">Any colour</option>
            {PRODUCT_COLORS.map((color) => (
              <option key={color} value={color}>
                {color}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="filter-stars">Minimum rating</Label>
          <Select
            id="filter-stars"
            value={String(local.stars ?? '')}
            onChange={(e) =>
              update({
                stars: e.target.value === '' ? undefined : Number(e.target.value),
              })
            }
          >
            <option value="">Any rating</option>
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {n} star{n > 1 ? 's' : ''} &amp; up
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="filter-shipping">Shipping</Label>
          <Select
            id="filter-shipping"
            value={local.shipping ?? ''}
            onChange={(e) =>
              update({ shipping: e.target.value || undefined })
            }
          >
            <option value="">Any</option>
            <option value="Yes">Available</option>
            <option value="No">Not available</option>
          </Select>
        </div>
      </div>

      <div className="mt-6 flex gap-2">
        {onReset ? (
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => {
              onReset();
            }}
          >
            Reset
          </Button>
        ) : null}
        <Button
          className="flex-1"
          onClick={() => {
            // A zero maximum means "no upper bound" — drop it so the API
            // does not apply `$lte: 0`.
            const price =
              local.price && (local.price[0] > 0 || local.price[1] > 0)
                ? local.price
                : undefined;
            onApply({ ...local, price });
          }}
        >
          Apply
        </Button>
      </div>
    </div>
  );
}
