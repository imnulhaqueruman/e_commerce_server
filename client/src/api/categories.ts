import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/fetcher';
import type { Category } from '@/types';

export { useSubs, useSub, useCreateSub, useDeleteSub } from './subs';

export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await api.get<Category[]>('/categories');
      return data;
    },
  });
};

export const useCategory = (slug: string | undefined) => {
  return useQuery({
    queryKey: ['category', slug],
    queryFn: async () => {
      const { data } = await api.get(`/category/${slug}`);
      return data as Category;
    },
    enabled: Boolean(slug),
  });
};

export const useCategorySubs = (categoryId: string | undefined) => {
  return useQuery({
    queryKey: ['category', 'subs', categoryId],
    queryFn: async () => {
      const { data } = await api.get(`/category/subs/${categoryId}`);
      return data as Array<{ _id: string; name: string; slug: string }>;
    },
    enabled: Boolean(categoryId),
  });
};

export const useCreateCategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { name: string }) => {
      const { data } = await api.post<Category>('/category', payload);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categories'] }),
  });
};

export const useUpdateCategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ slug, payload }: { slug: string; payload: { name: string } }) => {
      const { data } = await api.put<Category>(`/category/${slug}`, payload);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categories'] }),
  });
};

export const useDeleteCategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (slug: string) => {
      const { data } = await api.delete(`/category/${slug}`);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categories'] }),
  });
};