import * as SecureStore from "expo-secure-store";
import { secureStorage } from "../../../shared/services/secureStore";

jest.mock("expo-secure-store", () => {
  const store: Record<string, string> = {};
  return {
    getItemAsync: jest.fn(async (key: string) => store[key] ?? null),
    setItemAsync: jest.fn(async (key: string, val: string) => {
      store[key] = val;
    }),
    deleteItemAsync: jest.fn(async (key: string) => {
      delete store[key];
    }),
  };
});

describe("secureStorage MPIN lifecycle", () => {
  beforeEach(async () => {
    await secureStorage.clearMpin();
    jest.clearAllMocks();
  });

  it("saves, reads, and clears the 4-digit MPIN", async () => {
    expect(await secureStorage.getMpin()).toBeNull();

    await secureStorage.setMpin("4321");
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith("mediate_user_mpin", "4321");
    expect(await secureStorage.getMpin()).toBe("4321");

    await secureStorage.clearMpin();
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith("mediate_user_mpin");
    expect(await secureStorage.getMpin()).toBeNull();
  });
});
