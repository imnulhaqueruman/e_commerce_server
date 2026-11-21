import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { http } from '@/shared/lib/http';
import type {
  PaginatedProducts,
  Product,
  ProductFilters,
} from '@/shared/types';

export interface ProductListParams {
  sort?: string;
  order?: 'asc' | 'desc';
  page?: number;
  perPage?: number;
}

/**
 * Paginated product list — `POST /api/products`.
 *
 * The response is `{ items, page, perPage, total, totalPages }`.
 */
export const useProducts = (params: ProductListParams = {}) => {
  return useQuery({
    queryKey: ['catalog', 'products', params],
    queryFn: async () => {
      const { data } = await http.post<PaginatedProducts>('/products', params);
      return data;
    },
    staleTime: 30_000,
  });
};

/**
 * The newest N products — `GET /api/products/:count`.
 *
 * Used for the home page rail and the related-products strip.
 */
export const useLatestProducts = (count = 12) => {
  return useQuery({
    queryKey: ['catalog', 'latest', count],
    queryFn: async () => {
      const { data } = await http.get<Product[]>(`/products/${count}`);
      return data;
    },
    staleTime: 30_000,
  });
};

export const useProductCount = () => {
  return useQuery({
    queryKey: ['catalog', 'count'],
    queryFn: async () => {
      const { data } = await http.get<number>('/products/total');
      return data;
    },
    staleTime: 60_000,
  });
};

export const useProduct = (slug: string | undefined) => {
  return useQuery({
    queryKey: ['catalog', 'product', slug],
    queryFn: async () => {
      const { data } = await http.get<Product>(`/product/${slug}`);
      return data;
    },
    enabled: Boolean(slug),
    retry: false,
  });
};

export const useRelatedProducts = (productId: string | undefined) => {
  return useQuery({
    queryKey: ['catalog', 'related', productId],
    queryFn: async () => {
      const { data } = await http.get<Product[]>(
        `/product/related/${productId}`,
      );
      return data;
    },
    enabled: Boolean(productId),
    retry: false,
    staleTime: 60_000,
  });
};

/**
 * Filtered search — `POST /api/search/filters`.
 *
 * Every supplied filter is combined server-side, so the client sends the
 * whole filter set rather than chaining requests.
 */
export const useProductSearch = (filters: ProductFilters) => {
  const hasFilter = Object.values(filters).some(
    (value) => value !== undefined && value !== null && value !== '',
  );

  return useQuery({
    queryKey: ['catalog', 'search', filters],
    queryFn: async () => {
      const { data } = await http.post<Product[]>('/search/filters', filters);
      return data;
    },
    enabled: hasFilter,
    retry: false,
  });
};

export const useCreateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: Partial<Product>) => {
      const { data } = await http.post<Product>('/product', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catalog'] });
    },
  });
};

export const useUpdateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      slug,
      payload,
    }: {
      slug: string;
      payload: Partial<Product>;
    }) => {
      const { data } = await http.put<Product>(`/product/${slug}`, payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catalog'] });
    },
  });
};

export const useDeleteProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (slug: string) => {
      const { data } = await http.delete(`/product/${slug}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catalog'] });
    },
  });
};

export const useRateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      productId,
      star,
    }: {
      productId: string;
      star: number;
    }) => {
      const { data } = await http.put<Product>(`/product/star/${productId}`, {
        star,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catalog'] });
    },
  });
};
