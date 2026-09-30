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
    try {
      const refreshToken = await secureStorage.getRefreshToken();
      if (refreshToken) {
        const { authApi } = await import("./api/authApi");
        await authApi.logout(refreshToken);
      }
    } catch {
      // Ignore network errors on logout to guarantee clean local state
    } finally {
      await secureStorage.clearTokens();
      set({ isAuthenticated: false, user: null, isLoading: false });
    }
  },

  initializeAuth: async () => {
    const accessToken = await secureStorage.getAccessToken();
    if (!accessToken) {
      set({ isAuthenticated: false, user: null, isLoading: false });
      return;
    }

    try {
      const { authApi } = await import("./api/authApi");
      const me = await authApi.getMe();
      set({
        isAuthenticated: true,
        user: {
          id: me.id,
          email: me.email,
          fullName: me.full_name,
          role: me.role as Role,
          permissions: me.permissions,
        },
        isLoading: false,
      });
    } catch {
      await secureStorage.clearTokens();
      set({ isAuthenticated: false, user: null, isLoading: false });
    }
  },
}));
