import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PublicUser } from '@wishbottle/shared';

interface AuthState {
  token: string | null;
  user: PublicUser | null;
  setAuth: (token: string, user: PublicUser) => void;
  setUser: (user: PublicUser) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setAuth: (token, user) => set({ token, user }),
      setUser: (user) => set({ user }),
      logout: () => set({ token: null, user: null }),
    }),
    { name: 'wishbottle.auth' },
  ),
);
