import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../../api/client";
import { useNetwork } from "./useNetwork";

export function useHealthCheck() {
  const network = useNetwork();

  const query = useQuery({
    queryKey: ["system", "health"],
    queryFn: async () => {
      const res = await apiClient.get<{ status: string }>("/api/v1/health");
      return res.data;
    },
    enabled: network.isConnected,
    staleTime: 60 * 1000,
    refetchInterval: 60 * 1000,
    retry: 1,
  });

  const isOnline = Boolean(network.isConnected && (query.isSuccess || !query.isError));

  return {
    isOnline,
    isHealthy: query.data?.status === "healthy" || query.data?.status === "ok",
    isLoading: query.isLoading,
  };
}

