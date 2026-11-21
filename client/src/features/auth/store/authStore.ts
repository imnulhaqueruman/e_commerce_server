import { create } from 'zustand';
import type { User } from '@/shared/types';
import {
  getStoredToken,
  setStoredToken,
  setUnauthorizedHandler,
  http,
} from '@/shared/lib/http';

interface AuthState {
  user: User | null;
  token: string | null;
  /** True until the stored token has been validated against the API. */
  loading: boolean;
  /** Fetch the current user for a stored token. */
  bootstrap: () => Promise<void>;
  setAuth: (args: { token: string; user: User }) => void;
  /** Update the cached user without touching the token. */
  setUser: (user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
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
      const { data } = await http.get<User>('/auth/current-user');
      set({ user: data, loading: false });
    } catch {
      // The token is stale or invalid — drop it.
      setStoredToken(null);
      set({ user: null, token: null, loading: false });
    }
  },

  setAuth: ({ token, user }) => {
    setStoredToken(token);
    set({ token, user, loading: false });
  },

  setUser: (user) => {
    set({ user });
  },

  logout: () => {
    setStoredToken(null);
    set({ user: null, token: null, loading: false });
  },
}));

// Wire 401 responses to a global logout, once, at module load.
setUnauthorizedHandler(() => {
  useAuthStore.getState().logout();
});

/** Convenience selector: is the signed-in user an admin? */
export const useIsAdmin = () => useAuthStore((s) => s.user?.role === 'admin');
