import { useInfiniteQuery } from "@tanstack/react-query";
import { useState, useEffect, useCallback } from "react";
import NetInfo from "@react-native-community/netinfo";
import { reportsApi, ReportQueryParams, ReportResponse } from "../api/reportsApi";
import { reportsStorage } from "../services/reportsStorage";
import { getReportErrorMessage } from "../utils/reportErrors";

export function useReportResult(reportKey: string, params: ReportQueryParams) {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [offlineCachedData, setOfflineCachedData] = useState<ReportResponse | null>(null);
  const [offlineCachedAt, setOfflineCachedAt] = useState<string | null>(null);

  // Monitor network status
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const online = Boolean(state.isConnected && state.isInternetReachable !== false);
      setIsOnline(online);
    });
    return () => unsubscribe();
  }, []);

  // TanStack infinite query
  const query = useInfiniteQuery({
    queryKey: ["reports", "detail", reportKey, params],
    queryFn: async ({ pageParam = 1 }) => {
      const queryParams: ReportQueryParams = {
        ...params,
        page: pageParam,
        page_size: 25,
      };
      const data = await reportsApi.getReport(reportKey, queryParams);

      // Cache the first page for offline viewing
      if (pageParam === 1 && data) {
        await reportsStorage.cacheReportResult(reportKey, data);
      }
      return data;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.page < lastPage.total_pages) {
        return lastPage.page + 1;
      }
      return undefined;
    },
    enabled: !!reportKey,
  });

  // If offline, check local cache
  const checkCache = useCallback(async () => {
    const cached = await reportsStorage.getCachedReportResult(reportKey);
    if (cached) {
      setOfflineCachedData(cached.data);
      setOfflineCachedAt(cached.cached_at);
    }
  }, [reportKey]);

  useEffect(() => {
    if (!isOnline) {
      checkCache();
    } else {
      setOfflineCachedData(null);
      setOfflineCachedAt(null);
    }
  }, [isOnline, checkCache]);

  // Aggregate items across all fetched pages
  const items = isOnline
    ? (query.data?.pages.flatMap((page) => page.items) || [])
    : (offlineCachedData?.items || []);
  const meta = isOnline ? (query.data?.pages[0]?.meta || null) : (offlineCachedData?.meta || null);
  const summary = isOnline ? (query.data?.pages[0]?.summary || {}) : (offlineCachedData?.summary || {});
  const totalRecords = isOnline ? (query.data?.pages[0]?.total ?? 0) : (offlineCachedData?.total ?? 0);
  const columns = isOnline ? (query.data?.pages[0]?.columns || []) : (offlineCachedData?.columns || []);

  const isShowingOfflineCache = !isOnline && Boolean(offlineCachedData);
  const errorMessage = query.error ? getReportErrorMessage(query.error) : null;

  return {
    reportKey,
    isLoading: query.isLoading && (isOnline || !offlineCachedData),
    isFetchingNextPage: query.isFetchingNextPage,
    hasNextPage: Boolean(query.hasNextPage),
    fetchNextPage: query.fetchNextPage,
    refetch: query.refetch,
    isRefetching: query.isRefetching,
    isError: isOnline ? query.isError : (query.isError && !offlineCachedData),
    error: query.error,
    errorMessage,

    // Data
    items,
    meta,
    summary,
    totalRecords,
    columns,

    // Offline state
    isOnline,
    isShowingOfflineCache,
    offlineCachedAt,
  };
}
