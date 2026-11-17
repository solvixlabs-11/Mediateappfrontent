import { useQuery } from "@tanstack/react-query";
import { mastersApi } from "../api/mastersApi";

export const MASTER_QUERY_KEYS = {
  all: ["masters"] as const,
  bulk: () => [...MASTER_QUERY_KEYS.all, "bulk"] as const,
  items: (type?: string) => [...MASTER_QUERY_KEYS.all, "items", type] as const,
  states: () => [...MASTER_QUERY_KEYS.all, "states"] as const,
  cities: (stateId?: number) => [...MASTER_QUERY_KEYS.all, "cities", stateId] as const,
  areas: (cityId?: number) => [...MASTER_QUERY_KEYS.all, "areas", cityId] as const,
};

export function useBulkDropdowns() {
  return useQuery({
    queryKey: MASTER_QUERY_KEYS.bulk(),
    queryFn: () => mastersApi.getBulkDropdowns(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useMasterItems(type?: string) {
  return useQuery({
    queryKey: MASTER_QUERY_KEYS.items(type),
    queryFn: () => mastersApi.listItems(type),
    staleTime: 5 * 60 * 1000,
  });
}

export function useStates() {
  return useQuery({
    queryKey: MASTER_QUERY_KEYS.states(),
    queryFn: () => mastersApi.getStates(),
    staleTime: 10 * 60 * 1000,
  });
}

export function useCities(stateId?: number) {
  return useQuery({
    queryKey: MASTER_QUERY_KEYS.cities(stateId),
    queryFn: () => mastersApi.getCities(stateId),
    staleTime: 10 * 60 * 1000,
  });
}

export function useAreas(cityId?: number) {
  return useQuery({
    queryKey: MASTER_QUERY_KEYS.areas(cityId),
    queryFn: () => mastersApi.getAreas(cityId),
    staleTime: 10 * 60 * 1000,
  });
}

