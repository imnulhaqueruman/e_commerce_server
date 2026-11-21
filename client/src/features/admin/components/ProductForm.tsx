import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Button } from '@/shared/ui/primitives/button';
import { Input } from '@/shared/ui/primitives/input';
import { Label } from '@/shared/ui/primitives/label';
import { Select } from '@/shared/ui/primitives/select';
import { Textarea } from '@/shared/ui/primitives/textarea';
import { ImageUploader, type UploadedImage } from '@/shared/ui/ImageUploader';
import {
  PRODUCT_BRANDS,
  PRODUCT_COLORS,
  type Product,
} from '@/shared/types';
import {
  useCategories,
  useCategorySubs,
} from '@/features/catalog/api/categories';
import {
  useCreateProduct,
  useUpdateProduct,
} from '@/features/catalog/api/products';

const schema = z.object({
  title: z.string().min(2, 'Title is required'),
  description: z.string().min(10, 'Description is required'),
  price: z.coerce.number().min(0, 'Price cannot be negative'),
  quantity: z.coerce.number().int().min(0, 'Quantity cannot be negative'),
  category: z.string().optional(),
  subs: z.array(z.string()).optional(),
  color: z.string().optional(),
  brand: z.string().optional(),
  shipping: z.enum(['Yes', 'No']).optional(),
});

type FormValues = z.infer<typeof schema>;

/**
 * The admin product form.
 *
 * A slug is never sent — the server derives it from the title. Editing
 * the title therefore regenerates the slug and breaks the old product URL,
 * which the form warns about.
 */
export function ProductForm({
  initial,
  onDone,
}: {
  initial?: Product;
  onDone: () => void;
}) {
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const { data: categories = [] } = useCategories();

  const [categoryId, setCategoryId] = useState(
    typeof initial?.category === 'string'
      ? initial.category
      : (initial?.category as { _id?: string } | undefined)?._id ?? '',
  );
  const { data: subs = [] } = useCategorySubs(categoryId);
  const [images, setImages] = useState<UploadedImage[]>(
    (initial?.images ?? []).map((url, index) => ({
      public_id: `existing-${index}`,
      url,
    })),
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: initial?.title ?? '',
      description: initial?.description ?? '',
      price: initial?.price != null ? Number(initial.price) : 0,
      quantity: initial?.quantity ?? 0,
      category: categoryId,
      color: initial?.color ?? '',
      brand: initial?.brand ?? '',
      shipping: (initial?.shipping as 'Yes' | 'No' | undefined) ?? 'Yes',
    },
  });

  // Keep the form in sync when a different product is loaded.
  useEffect(() => {
    if (!initial) return;
    reset({
      title: initial.title ?? '',
      description: initial.description ?? '',
      price: initial.price != null ? Number(initial.price) : 0,
      quantity: initial.quantity ?? 0,
      category: categoryId,
      color: initial.color ?? '',
      brand: initial.brand ?? '',
      shipping: (initial.shipping as 'Yes' | 'No' | undefined) ?? 'Yes',
    });
  }, [initial, reset, categoryId]);

  const submit = (values: FormValues) => {
    const payload: Partial<Product> = {
      title: values.title,
      description: values.description,
      price: values.price,
      quantity: values.quantity,
      category: values.category || undefined,
      subs: values.subs ?? [],
      color: values.color || undefined,
      brand: values.brand || undefined,
      shipping: values.shipping,
      images: images.map((image) => image.url),
    };

    const options = {
      onSuccess: () => {
        toast.success(initial ? 'Product updated' : 'Product created');
        onDone();
      },
      onError: (error: unknown) => {
        toast.error(
          error instanceof Error ? error.message : 'Could not save the product',
        );
      },
    };

    if (initial) {
      updateProduct.mutate({ slug: initial.slug, payload }, options);
    } else {
      createProduct.mutate(payload, options);
    }
  };

  const pending = createProduct.isPending || updateProduct.isPending;

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="product-title">Title</Label>
        <Input id="product-title" aria-invalid={Boolean(errors.title)} {...register('title')} />
        {errors.title ? (
          <p className="text-xs text-destructive">{errors.title.message}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="product-description">Description</Label>
        <Textarea
          id="product-description"
          rows={4}
          aria-invalid={Boolean(errors.description)}
          {...register('description')}
        />
        {errors.description ? (
          <p className="text-xs text-destructive">
            {errors.description.message}
          </p>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="product-price">Price</Label>
          <Input
            id="product-price"
            type="number"
            step="0.01"
            min={0}
            aria-invalid={Boolean(errors.price)}
            {...register('price')}
          />
          {errors.price ? (
            <p className="text-xs text-destructive">{errors.price.message}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="product-quantity">Quantity</Label>
          <Input
            id="product-quantity"
            type="number"
            min={0}
            aria-invalid={Boolean(errors.quantity)}
            {...register('quantity')}
          />
          {errors.quantity ? (
            <p className="text-xs text-destructive">
              {errors.quantity.message}
            </p>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="product-category">Category</Label>
          <Select
            id="product-category"
            value={categoryId}
            onChange={(e) => {
              setCategoryId(e.target.value);
              register('category').onChange(e);
            }}
          >
            <option value="">No category</option>
            {categories.map((category) => (
              <option key={category._id} value={category._id}>
                {category.name}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="product-sub">Sub category</Label>
          <Select
            id="product-sub"
            onChange={(e) => {
              const value = e.target.value;
              register('subs').onChange({
                target: { name: 'subs', value: value ? [value] : [] },
              });
            }}
          >
            <option value="">No sub category</option>
            {subs.map((sub) => (
              <option key={sub._id} value={sub._id}>
                {sub.name}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="product-color">Colour</Label>
          <Select id="product-color" {...register('color')}>
            <option value="">Any</option>
            {PRODUCT_COLORS.map((color) => (
              <option key={color} value={color}>
                {color}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="product-brand">Brand</Label>
          <Select id="product-brand" {...register('brand')}>
            <option value="">Any</option>
            {PRODUCT_BRANDS.map((brand) => (
              <option key={brand} value={brand}>
                {brand}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="product-shipping">Shipping</Label>
          <Select id="product-shipping" {...register('shipping')}>
            <option value="Yes">Available</option>
            <option value="No">Not available</option>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Images</Label>
        <ImageUploader images={images} onChange={setImages} />
      </div>

      {initial ? (
        <p className="rounded-lg border border-warning/40 bg-warning/10 p-3 text-xs text-warning-foreground">
          Changing the title regenerates the product slug, so the existing
          product URL will stop working.
        </p>
      ) : null}

      <div className="flex gap-2 pt-2">
        <Button type="submit" disabled={pending}>
          {pending ? 'Saving…' : initial ? 'Save changes' : 'Create product'}
        </Button>
        <Button type="button" variant="outline" onClick={onDone} disabled={pending}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
