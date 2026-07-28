import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/fetcher';
import type { Sub } from '@/types';

export const useSubs = () => {
  return useQuery({
    queryKey: ['subs'],
    queryFn: async () => {
      const { data } = await api.get<Sub[]>('/subs');
      return data;
    },
  });
};

export const useSub = (slug: string | undefined) => {
  return useQuery({
    queryKey: ['sub', slug],
    queryFn: async () => {
      const { data } = await api.get(`/sub/${slug}`);
      return data;
    },
    enabled: Boolean(slug),
  });
};

export const useCreateSub = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { name: string; parent: string }) => {
      const { data } = await api.post<Sub>('/sub', payload);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['subs'] }),
  });
};

export const useDeleteSub = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (slug: string) => {
      const { data } = await api.delete(`/sub/${slug}`);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['subs'] }),
  });
};