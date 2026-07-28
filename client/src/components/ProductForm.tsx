import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { useCategories } from '@/api/categories';
import { useCategorySubs } from '@/api/categories';
import { useUploadImage, useRemoveImage } from '@/api/cloudinary';
import type { Product } from '@/types';
import { toast } from 'react-hot-toast';

const COLORS = ['Black', 'Brown', 'Silver', 'White', 'Blue'];
const BRANDS = ['Apple', 'Samsung', 'Microsoft', 'Lenovo', 'ASUS'];

const schema = z.object({
  title: z.string().min(2, 'Title is required'),
  description: z.string().min(10, 'Description is required'),
  price: z.string().min(1, 'Price is required'),
  quantity: z.coerce.number().int().min(0),
  category: z.string().optional(),
  subs: z.array(z.string()).optional(),
  color: z.string().optional(),
  brand: z.string().optional(),
  shipping: z.enum(['Yes', 'No']).optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  initial?: Partial<Product>;
  onSubmit: (payload: Partial<Product>) => void;
  submitting?: boolean;
}

interface UploadedImage {
  public_id: string;
  url: string;
}

export default function ProductForm({ initial, onSubmit, submitting }: Props) {
  const { data: categories = [] } = useCategories();
  const [selectedCategory, setSelectedCategory] = useState(
    (initial?.category as any)?._id ?? (initial?.category as string) ?? ''
  );
  const { data: subs = [] } = useCategorySubs(selectedCategory);
  const uploadMutation = useUploadImage();
  const removeMutation = useRemoveImage();
  const [images, setImages] = useState<UploadedImage[]>(
    (initial?.images ?? []).map((url, i) => ({
      public_id: `existing-${i}`,
      url,
    }))
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: initial?.title ?? '',
      description: initial?.description ?? '',
      price: initial?.price != null ? String(initial.price) : '',
      quantity: initial?.quantity ?? 0,
      category: (initial?.category as any)?._id ?? (initial?.category as string) ?? '',
      color: initial?.color ?? '',
      brand: initial?.brand ?? '',
      shipping: (initial?.shipping as any) ?? 'Yes',
    },
  });

  useEffect(() => {
    register('subs');
  }, [register]);

  const handleFile = async (file: File) => {
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      try {
        const res = await uploadMutation.mutateAsync(dataUrl);
        setImages((prev) => [...prev, res]);
        toast.success('Image uploaded');
      } catch {
        toast.error('Upload failed');
      }
    };
    reader.readAsDataURL(file);
  };

  const removeImageAt = async (idx: number) => {
    const target = images[idx];
    if (!target.public_id.startsWith('existing-')) {
      try {
        await removeMutation.mutateAsync(target.public_id);
      } catch {
        /* ignore */
      }
    }
    setImages((prev) => prev.filter((_, i) => i !== idx));
  };

  return (
    <form
      onSubmit={handleSubmit((values) => {
        const subIds = (values.subs as any) ?? [];
        onSubmit({
          ...values,
          subs: Array.isArray(subIds) ? subIds : [],
          images: images.map((i) => i.url),
        });
      })}
      className="space-y-4"
    >
      <div className="grid gap-2">
        <Label htmlFor="title">Title</Label>
        <Input id="title" {...register('title')} />
        {errors.title && (
          <p className="text-xs text-destructive">{errors.title.message}</p>
        )}
      </div>
      <div className="grid gap-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" rows={4} {...register('description')} />
        {errors.description && (
          <p className="text-xs text-destructive">
            {errors.description.message}
          </p>
        )}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="price">Price</Label>
          <Input id="price" type="number" step="0.01" {...register('price')} />
          {errors.price && (
            <p className="text-xs text-destructive">{errors.price.message}</p>
          )}
        </div>
        <div className="grid gap-2">
          <Label htmlFor="quantity">Quantity</Label>
          <Input
            id="quantity"
            type="number"
            {...register('quantity', { valueAsNumber: true })}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="category">Category</Label>
          <Select
            id="category"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="">Select category</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="subs">Sub category</Label>
          <Select
            id="subs"
            onChange={(e) => {
              const val = e.target.value;
              const current = (document.getElementById('subs-multi') as HTMLSelectElement | null);
              const selected = Array.from(current?.selectedOptions ?? []).map(
                (o) => o.value
              );
              register('subs').onChange({
                target: { name: 'subs', value: selected.length ? selected : val ? [val] : [] },
              });
            }}
          >
            <option value="">Select sub</option>
            {subs.map((s: any) => (
              <option key={s._id} value={s._id}>
                {s.name}
              </option>
            ))}
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="grid gap-2">
          <Label>Color</Label>
          <Select {...register('color')}>
            <option value="">Any</option>
            {COLORS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </div>
        <div className="grid gap-2">
          <Label>Brand</Label>
          <Select {...register('brand')}>
            <option value="">Any</option>
            {BRANDS.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </Select>
        </div>
        <div className="grid gap-2">
          <Label>Shipping</Label>
          <Select {...register('shipping')}>
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label>Images</Label>
        <Input
          type="file"
          accept="image/*"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />
        <div className="grid grid-cols-4 gap-2">
          {images.map((img, idx) => (
            <div
              key={img.public_id + idx}
              className="relative aspect-square overflow-hidden rounded-md border"
            >
              <img
                src={img.url}
                alt=""
                className="h-full w-full object-cover"
              />
              <button
                type="button"
                onClick={() => removeImageAt(idx)}
                className="absolute right-1 top-1 rounded bg-destructive px-2 text-xs text-destructive-foreground"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>
      <Button type="submit" disabled={submitting}>
        {submitting ? 'Saving…' : 'Save product'}
      </Button>
    </form>
  );
}