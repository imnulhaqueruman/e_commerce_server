import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '@/lib/fetcher';
import { useAuthStore } from '@/store/authStore';
import type { AuthResponse, User } from '@/types';

export const useLogin = () => {
  const setAuth = useAuthStore((s) => s.setAuth);
  return useMutation({
    mutationFn: async (payload: { email: string; password: string }) => {
      const { data } = await api.post<AuthResponse>('/auth/login', payload);
      return data;
    },
    onSuccess: (data) => {
      setAuth({ token: data.token, user: data.user });
    },
  });
};

export const useRegister = () => {
  const setAuth = useAuthStore((s) => s.setAuth);
  return useMutation({
    mutationFn: async (payload: {
      email: string;
      password: string;
      name?: string;
    }) => {
      const { data } = await api.post<AuthResponse>('/auth/register', payload);
      return data;
    },
    onSuccess: (data) => {
      setAuth({ token: data.token, user: data.user });
    },
  });
};

export const useLogout = () => {
  const logout = useAuthStore((s) => s.logout);
  return useMutation({
    mutationFn: async () => {
      try {
        await api.post('/auth/logout');
      } catch {
        /* ignore — client logout is the source of truth */
      }
    },
    onSettled: () => {
      logout();
    },
  });
};

export const useCurrentUser = () => {
  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const { data } = await api.get<User>('/auth/current-user');
      return data;
    },
    enabled: Boolean(useAuthStore.getState().token),
    retry: false,
  });
};