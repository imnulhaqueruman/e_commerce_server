import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { http } from '@/shared/lib/http';
import type { Category, Sub } from '@/shared/types';

export const useCategories = () => {
  return useQuery({
    queryKey: ['catalog', 'categories'],
    queryFn: async () => {
      const { data } = await http.get<Category[]>('/categories');
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const useCategory = (slug: string | undefined) => {
  return useQuery({
    queryKey: ['catalog', 'category', slug],
    queryFn: async () => {
      const { data } = await http.get<{ category: Category; products: unknown[] }>(
        `/category/${slug}`,
      );
      return data;
    },
    enabled: Boolean(slug),
  });
};

export const useCategorySubs = (categoryId: string | undefined) => {
  return useQuery({
    queryKey: ['catalog', 'category-subs', categoryId],
    queryFn: async () => {
      const { data } = await http.get<Sub[]>(`/category/subs/${categoryId}`);
      return data;
    },
    enabled: Boolean(categoryId),
  });
};

export const useCreateCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { name: string }) => {
      const { data } = await http.post<Category>('/category', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catalog', 'categories'] });
    },
  });
};

export const useUpdateCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      slug,
      payload,
    }: {
      slug: string;
      payload: { name: string };
    }) => {
      const { data } = await http.put<Category>(`/category/${slug}`, payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catalog'] });
    },
  });
};

export const useDeleteCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (slug: string) => {
      const { data } = await http.delete(`/category/${slug}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catalog'] });
    },
  });
};

export const useSubs = () => {
  return useQuery({
    queryKey: ['catalog', 'subs'],
    queryFn: async () => {
      const { data } = await http.get<Sub[]>('/subs');
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const useSub = (slug: string | undefined) => {
  return useQuery({
    queryKey: ['catalog', 'sub', slug],
    queryFn: async () => {
      const { data } = await http.get<{ sub: Sub; products: unknown[] }>(
        `/sub/${slug}`,
      );
      return data;
    },
    enabled: Boolean(slug),
  });
};

export const useCreateSub = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { name: string; parent: string }) => {
      const { data } = await http.post<Sub>('/sub', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catalog'] });
    },
  });
};

export const useUpdateSub = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      slug,
      payload,
    }: {
      slug: string;
      payload: { name: string; parent: string };
    }) => {
      const { data } = await http.put<Sub>(`/sub/${slug}`, payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catalog'] });
    },
  });
};

export const useDeleteSub = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (slug: string) => {
      const { data } = await http.delete(`/sub/${slug}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catalog'] });
    },
  });
};
