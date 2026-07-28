import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/fetcher';

export const useUploadImage = () => {
  return useMutation({
    mutationFn: async (image: string) => {
      const { data } = await api.post<{ public_id: string; url: string }>(
        '/uploadimages',
        { image }
      );
      return data;
    },
  });
};

export const useRemoveImage = () => {
  return useMutation({
    mutationFn: async (public_id: string) => {
      const { data } = await api.post('/removeimages', { public_id });
      return data;
    },
  });
};