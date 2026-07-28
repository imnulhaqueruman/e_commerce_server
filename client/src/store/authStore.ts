import { create } from 'zustand';
import type { User } from '@/types';
import {
  getStoredToken,
  setStoredToken,
  setUnauthorizedHandler,
  api,
} from '@/lib/fetcher';

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  bootstrap: () => Promise<void>;
  setAuth: (args: { token: string; user: User }) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  loading: true,

  bootstrap: async () => {
    const token = getStoredToken();
    if (!token) {
      set({ loading: false });
      return;
    }
    set({ token });
    try {
      const { data } = await api.get('/auth/current-user');
      set({ user: data, loading: false });
    } catch {
      setStoredToken(null);
      set({ user: null, token: null, loading: false });
    }
  },

  setAuth: ({ token, user }) => {
    setStoredToken(token);
    set({ token, user });
  },

  logout: () => {
    setStoredToken(null);
    set({ user: null, token: null });
  },
}));

// Wire 401 responses to global logout.
setUnauthorizedHandler(() => {
  useAuthStore.getState().logout();
});