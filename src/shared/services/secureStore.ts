import * as SecureStore from "expo-secure-store";

const ACCESS_TOKEN_KEY = "mediate_access_token";
const REFRESH_TOKEN_KEY = "mediate_refresh_token";
const MPIN_KEY = "mediate_user_mpin";

export const secureStorage = {
  async getAccessToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
    } catch {
      return null;
    }
  },

  async setAccessToken(token: string): Promise<void> {
    await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token);
  },

  async getRefreshToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
    } catch {
      return null;
    }
  },

  async setRefreshToken(token: string): Promise<void> {
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
  },

  async getMpin(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(MPIN_KEY);
    } catch {
      return null;
    }
  },

  async setMpin(mpin: string): Promise<void> {
    await SecureStore.setItemAsync(MPIN_KEY, mpin);
  },

  async clearMpin(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(MPIN_KEY);
    } catch {
      // Ignore
    }
  },

  async clearTokens(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
      await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    } catch {
      // Ignore if keys not present
    }
  },
};
