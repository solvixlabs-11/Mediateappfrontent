import { useState } from "react";
import { useToastStore } from "../../../shared/components/Toast";
import { authApi, LoginRequest } from "../api/authApi";
import { Role, useAuthStore } from "../store";

export const useLogin = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const setAuth = useAuthStore((s) => s.setAuth);
  const showToast = useToastStore((s) => s.showToast);

  const login = async (credentials: LoginRequest): Promise<boolean> => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await authApi.login(credentials);
      await setAuth(
        {
          id: data.user.id,
          email: data.user.email,
          fullName: data.user.full_name,
          role: data.user.role as Role,
          permissions: data.user.permissions,
        },
        data.access_token,
        data.refresh_token
      );
      showToast(`Welcome back, ${data.user.full_name}!`, "success");
      return true;
    } catch (err: unknown) {
      let detail = "Failed to authenticate. Please check your credentials.";
      if (
        typeof err === "object" &&
        err !== null &&
        "response" in err &&
        typeof (err as { response?: { data?: { detail?: string } } }).response?.data?.detail ===
          "string"
      ) {
        detail = (err as { response: { data: { detail: string } } }).response.data.detail;
      } else if (err instanceof Error) {
        detail = err.message;
      }
      setErrorMessage(detail);
      showToast(detail, "error");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    login,
    isLoading,
    errorMessage,
  };
};
