import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { NotificationFilterParams, notificationsApi } from "../api/notificationsApi";

export const NOTIFICATION_QUERY_KEYS = {
  all: ["notifications"] as const,
  lists: () => [...NOTIFICATION_QUERY_KEYS.all, "list"] as const,
  list: (params?: NotificationFilterParams) =>
    [...NOTIFICATION_QUERY_KEYS.lists(), params] as const,
  summary: () => [...NOTIFICATION_QUERY_KEYS.all, "summary"] as const,
};

export function useNotifications(params?: NotificationFilterParams) {
  return useQuery({
    queryKey: NOTIFICATION_QUERY_KEYS.list(params),
    queryFn: () => notificationsApi.list(params),
    staleTime: 30 * 1000,
  });
}

export function useNotificationSummary() {
  return useQuery({
    queryKey: NOTIFICATION_QUERY_KEYS.summary(),
    queryFn: () => notificationsApi.getSummary(),
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => notificationsApi.markRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_QUERY_KEYS.all });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_QUERY_KEYS.all });
    },
  });
}

export function useDeleteNotification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => notificationsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_QUERY_KEYS.all });
    },
  });
}

