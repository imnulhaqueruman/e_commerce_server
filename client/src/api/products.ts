import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/fetcher';
import type { Product } from '@/types';

export interface ProductFilters {
  sort?: string;
  order?: 'asc' | 'desc';
  page?: number;
}

export const useProducts = (filters: ProductFilters = {}) => {
  return useQuery({
    queryKey: ['products', filters],
    queryFn: async () => {
      const { data } = await api.post<Product[]>('/products', filters);
      return data;
    },
  });
};

export const useAllProducts = (count = 12) => {
  return useQuery({
    queryKey: ['products', 'all', count],
    queryFn: async () => {
      const { data } = await api.get<Product[]>(`/products/${count}`);
      return data;
    },
  });
};

export const useProduct = (slug: string | undefined) => {
  return useQuery({
    queryKey: ['product', slug],
    queryFn: async () => {
      const { data } = await api.get<Product>(`/product/${slug}`);
      return data;
    },
    enabled: Boolean(slug),
  });
};

export const useRelatedProducts = (productId: string | undefined) => {
  return useQuery({
    queryKey: ['product', 'related', productId],
    queryFn: async () => {
      const { data } = await api.get<Product[]>(
        `/product/related/${productId}`
      );
      return data;
    },
    enabled: Boolean(productId),
  });
};

export const useProductSearch = (filters: Record<string, unknown>) => {
  return useQuery({
    queryKey: ['products', 'search', filters],
    queryFn: async () => {
      const { data } = await api.post<Product[]>('/search/filters', filters);
      return data;
    },
    enabled: Object.values(filters).some(Boolean),
  });
};

export const useCreateProduct = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<Product>) => {
      const { data } = await api.post<Product>('/product', payload);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  });
};

export const useUpdateProduct = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ slug, payload }: { slug: string; payload: Partial<Product> }) => {
      const { data } = await api.put<Product>(`/product/${slug}`, payload);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  });
};

export const useDeleteProduct = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (slug: string) => {
      const { data } = await api.delete(`/product/${slug}`);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  });
};

export const useRateProduct = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ productId, star }: { productId: string; star: number }) => {
      const { data } = await api.put(`/product/star/${productId}`, { star });
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['product'] }),
  });
};