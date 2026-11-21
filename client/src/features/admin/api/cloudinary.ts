import { useMutation } from '@tanstack/react-query';
import { http } from '@/shared/lib/http';

interface UploadedImage {
  public_id: string;
  url: string;
}

/**
 * Upload an image to Cloudinary.
 *
 * The body is a base64 data URL, not a multipart form — the server
 * controller reads `req.body.image` and hands it to
 * `cloudinary.uploader.upload`.
 */
export const useUploadImage = () => {
  return useMutation({
    mutationFn: async (image: string) => {
      const { data } = await http.post<UploadedImage>('/uploadimages', {
        image,
      });
      return data;
    },
  });
};

/**
 * Remove an uploaded image.
 *
 * `public_id` is the value returned by the upload. The server answers
 * `200 { success: false, err }` on failure, so a soft failure here is a
 * toast rather than a crash.
 */
export const useRemoveImage = () => {
  return useMutation({
    mutationFn: async (publicId: string) => {
      const { data } = await http.post<{ success?: boolean; err?: string }>(
        '/removeimages',
        { public_id: publicId },
      );
      return data;
    },
  });
};
