import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { http } from '@/shared/lib/http';
import { useAuthStore } from '@/features/auth/store/authStore';
import type { AuthResponse, User } from '@/shared/types';

export const useLogin = () => {
  const setAuth = useAuthStore((s) => s.setAuth);

  return useMutation({
    mutationFn: async (payload: { email: string; password: string }) => {
      const { data } = await http.post<AuthResponse>('/auth/login', payload);
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
      const { data } = await http.post<AuthResponse>('/auth/register', payload);
      return data;
    },
    onSuccess: (data) => {
      setAuth({ token: data.token, user: data.user });
    },
  });
};

export const useLogout = () => {
  const logout = useAuthStore((s) => s.logout);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      try {
        await http.post('/auth/logout');
      } catch {
        // The client-side logout is the source of truth — a failed
        // server round-trip must not block signing out.
      }
    },
    onSettled: () => {
      logout();
      // Drop every cached response — the next user must not see the
      // previous session's data.
      queryClient.clear();
    },
  });
};

export const useCurrentUser = () => {
  const token = useAuthStore((s) => s.token);

  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const { data } = await http.get<User>('/auth/current-user');
      return data;
    },
    enabled: Boolean(token),
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
};
