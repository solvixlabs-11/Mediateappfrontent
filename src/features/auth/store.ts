import { create } from "zustand";
import { secureStorage } from "../../shared/services/secureStore";

export type Role = "ADMIN" | "MANAGER" | "MR";

export interface AuthUser {
  id: number;
  email: string;
  fullName: string;
  role: Role;
  permissions?: string[];
}

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: AuthUser | null;
  setAuth: (user: AuthUser, accessToken: string, refreshToken: string) => Promise<void>;
  logout: () => Promise<void>;
  initializeAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  isLoading: true,
  user: null,

  setAuth: async (user: AuthUser, accessToken: string, refreshToken: string) => {
    await secureStorage.setAccessToken(accessToken);
    await secureStorage.setRefreshToken(refreshToken);
    set({ isAuthenticated: true, user, isLoading: false });
  },

  logout: async () => {
    await secureStorage.clearTokens();
    set({ isAuthenticated: false, user: null, isLoading: false });
  },

  initializeAuth: async () => {
    const accessToken = await secureStorage.getAccessToken();
    if (accessToken) {
      // In Phase 1, we validate via /auth/me. In Phase 0, we verify token presence.
      set({ isAuthenticated: true, isLoading: false });
    } else {
      set({ isAuthenticated: false, isLoading: false });
    }
  },
}));
