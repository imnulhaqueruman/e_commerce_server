import { useRef, useState } from 'react';
import { ImagePlus, X } from 'lucide-react';
import { Button } from '@/shared/ui/primitives/button';
import { useUploadImage, useRemoveImage } from '@/features/admin/api/cloudinary';
import { cn } from '@/lib/utils';

export interface UploadedImage {
  public_id: string;
  url: string;
}

/**
 * A multi-image uploader backed by Cloudinary.
 *
 * The API takes a base64 data URL in `req.body.image`, so the file is
 * read with `FileReader` rather than sent as multipart form data.
 */
export function ImageUploader({
  images,
  onChange,
  max = 6,
  className,
}: {
  images: UploadedImage[];
  onChange: (images: UploadedImage[]) => void;
  max?: number;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const upload = useUploadImage();
  const remove = useRemoveImage();
  const [error, setError] = useState<string | null>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError(null);

    for (const file of Array.from(files)) {
      if (images.length >= max) {
        setError(`Up to ${max} images per product.`);
        break;
      }

      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error('Could not read the file'));
        reader.readAsDataURL(file);
      }).catch(() => null);

      if (!dataUrl) {
        setError('Could not read that file.');
        continue;
      }

      try {
        const result = await upload.mutateAsync(dataUrl);
        onChange([...images, result]);
      } catch {
        setError('Upload failed. Check the Cloudinary configuration.');
      }
    }
  };

  const handleRemove = async (index: number) => {
    const target = images[index];
    onChange(images.filter((_, i) => i !== index));

    // Images uploaded during this session have a real public_id; ones that
    // were already on the product do not, and there is nothing to delete
    // from Cloudinary for those.
    if (!target.public_id.startsWith('existing-')) {
      try {
        await remove.mutateAsync(target.public_id);
      } catch {
        // The image is already detached from the product — a failed
        // Cloudinary delete is not worth blocking the edit for.
      }
    }
  };

  return (
    <div className={cn('space-y-3', className)}>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {images.map((image, index) => (
          <div
            key={`${image.public_id}-${index}`}
            className="group relative aspect-square overflow-hidden rounded-lg border bg-muted"
          >
            <img
              src={image.url}
              alt=""
              className="h-full w-full object-cover"
            />
            <button
              type="button"
              onClick={() => handleRemove(index)}
              aria-label="Remove image"
              className="absolute right-1.5 top-1.5 rounded-md bg-background/90 p-1 text-destructive opacity-0 transition-opacity hover:bg-background focus-visible:opacity-100 group-hover:opacity-100"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}

        {images.length < max ? (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={upload.isPending}
            className="flex aspect-square flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed text-muted-foreground transition-colors hover:border-primary hover:text-primary disabled:opacity-50"
          >
            <ImagePlus className="h-5 w-5" />
            <span className="text-xs font-medium">
              {upload.isPending ? 'Uploading…' : 'Add image'}
            </span>
          </button>
        ) : null}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          void handleFiles(e.target.files);
          e.target.value = '';
        }}
      />

      {error ? (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => inputRef.current?.click()}
        disabled={upload.isPending}
      >
        <ImagePlus className="mr-1.5 h-4 w-4" />
        {upload.isPending ? 'Uploading…' : 'Upload images'}
      </Button>
    </div>
  );
}
