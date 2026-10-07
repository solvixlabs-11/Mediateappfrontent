import React, { useState } from "react";
import {
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { Header } from "../../../shared/components/Header";
import { Card } from "../../../shared/components/Card";
import { ScreenContainer } from "../../../shared/components/ScreenContainer";
import { Loader, EmptyState, ErrorState } from "../../../shared/components/StateViews";
import { colors, radii, spacing, typography } from "../../../shared/theme/tokens";
import { ROUTES } from "../../../navigation/routes";
import { useReportResult } from "../hooks/useReportResult";
import { ExportBottomSheet } from "../components/ExportBottomSheet";
import { ReportFilterState } from "../hooks/useReportFilters";

export function ReportResultScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const { reportKey, reportTitle, filterSchema, scopeLabel, filters } =
    (route.params || {}) as {
      reportKey: string;
      reportTitle: string;
      filterSchema: any;
      scopeLabel: string;
      filters: ReportFilterState;
    };

  const [isExportSheetVisible, setIsExportSheetVisible] = useState(false);

  const queryParams = {
    from_date: filters?.from_date || undefined,
    to_date: filters?.to_date || undefined,
    mr_id: filters?.mr_id,
    manager_id: filters?.manager_id,
    territory_id: filters?.territory_id,
    customer_type: filters?.customer_type,
    status: filters?.status,
    category: filters?.category,
    specialization: filters?.specialization,
    active: filters?.active,
    work_type: filters?.work_type,
    deviation_type: filters?.deviation_type,
  };

  const {
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
    isRefetching,
    isError,
    errorMessage,
    items,
    meta,
    summary,
    totalRecords,
    columns,
    isOnline,
    isShowingOfflineCache,
    offlineCachedAt,
  } = useReportResult(reportKey, queryParams);

  const handleReopenFilters = () => {
    navigation.navigate(ROUTES.ReportFilters as any, {
      reportKey,
      reportTitle,
      filterSchema,
      scopeLabel,
      existingFilters: filters,
    });
  };

  // Convert summary object into readable KPI cards
  const summaryEntries = Object.entries(summary || {}).filter(
    ([_, val]) => val !== null && val !== undefined && val !== ""
  );

  const formatSummaryLabel = (key: string): string => {
    return key
      .replace(/_/g, " ")
      .replace(/\bpct\b/g, "%")
      .replace(/\bavg\b/g, "Average")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const formatSummaryValue = (val: any): string => {
    if (typeof val === "number") {
      if (Number.isInteger(val)) return val.toLocaleString("en-IN");
      return val.toFixed(1);
    }
    return String(val);
  };

  return (
    <ScreenContainer>
      <Header
        title={reportTitle || "Report Details"}
        subtitle={meta?.scope_label || scopeLabel || "Scoped report"}
        showBack
        onBack={() => navigation.goBack()}
        rightAction={
          <TouchableOpacity
            style={[styles.exportBtn, !isOnline && styles.exportBtnDisabled]}
            disabled={!isOnline}
            onPress={() => setIsExportSheetVisible(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="download-outline" size={16} color="#FFFFFF" />
            <Text style={styles.exportBtnText}>Export</Text>
          </TouchableOpacity>
        }
      />

      {/* Offline banner */}
      {isShowingOfflineCache && (
        <View style={styles.offlineBanner}>
          <Ionicons name="cloud-offline" size={18} color="#92400E" />
          <View style={styles.offlineBannerContent}>
            <Text style={styles.offlineBannerTitle}>
              Reports need internet. Showing last saved result
            </Text>
            {offlineCachedAt && (
              <Text style={styles.offlineBannerSubtitle}>
                Cached on{" "}
                {new Date(offlineCachedAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
            )}
          </View>
        </View>
      )}

      {/* Filter Chips Bar (Tap to reopen filters) */}
      <View style={styles.chipsBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
          <TouchableOpacity
            style={styles.filterChip}
            onPress={handleReopenFilters}
            activeOpacity={0.7}
          >
            <Ionicons name="calendar-outline" size={13} color={colors.primaryDark} />
            <Text style={styles.filterChipText}>
              {filters?.from_date} to {filters?.to_date}
            </Text>
            <Ionicons name="pencil" size={11} color={colors.primaryDark} />
          </TouchableOpacity>

          {filters?.mr_name && (
            <TouchableOpacity
              style={styles.filterChip}
              onPress={handleReopenFilters}
              activeOpacity={0.7}
            >
              <Ionicons name="person-outline" size={13} color={colors.primaryDark} />
              <Text style={styles.filterChipText}>MR: {filters.mr_name}</Text>
              <Ionicons name="pencil" size={11} color={colors.primaryDark} />
            </TouchableOpacity>
          )}

          {filters?.customer_type && (
            <TouchableOpacity
              style={styles.filterChip}
              onPress={handleReopenFilters}
              activeOpacity={0.7}
            >
              <Ionicons name="medkit-outline" size={13} color={colors.primaryDark} />
              <Text style={styles.filterChipText}>Type: {filters.customer_type}</Text>
            </TouchableOpacity>
          )}

          {filters?.status && (
            <TouchableOpacity
              style={styles.filterChip}
              onPress={handleReopenFilters}
              activeOpacity={0.7}
            >
              <Ionicons name="flag-outline" size={13} color={colors.primaryDark} />
              <Text style={styles.filterChipText}>Status: {filters.status}</Text>
            </TouchableOpacity>
          )}

          {filters?.territory_name && (
            <TouchableOpacity
              style={styles.filterChip}
              onPress={handleReopenFilters}
              activeOpacity={0.7}
            >
              <Ionicons name="map-outline" size={13} color={colors.primaryDark} />
              <Text style={styles.filterChipText}>{filters.territory_name}</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>

      {/* Main Content */}
      {isLoading ? (
        <Loader message="Loading report data..." />
      ) : isError ? (
        <ErrorState
          title="Failed to Load Report"
          message={errorMessage || "Please check your network connection and try again."}
          onRetry={refetch}
        />
      ) : items.length === 0 ? (
        <EmptyState
          title="No records for these filters"
          message="Try adjusting the date range or removing filters to view data."
          actionLabel="Edit Filters"
          onAction={handleReopenFilters}
        />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item, index) => String((item as any).id || (item as any).visit_id || index)}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          ListHeaderComponent={
            <View>
              {/* Summary KPI Strip */}
              {summaryEntries.length > 0 && (
                <View style={styles.summarySection}>
                  <Text style={styles.summaryTitle}>KEY PERFORMANCE SUMMARY</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.kpiRow}>
                    {summaryEntries.map(([k, v]) => (
                      <View key={k} style={styles.kpiCard}>
                        <Text style={styles.kpiValue}>{formatSummaryValue(v)}</Text>
                        <Text style={styles.kpiLabel} numberOfLines={2}>
                          {formatSummaryLabel(k)}
                        </Text>
                      </View>
                    ))}
                  </ScrollView>
                </View>
              )}

              {/* Total Records Counter */}
              <View style={styles.recordCountRow}>
                <Text style={styles.recordCountText}>
                  Showing {items.length} of {totalRecords} records
                </Text>
              </View>
            </View>
          }
          renderItem={({ item, index }) => (
            <Card style={styles.recordCard}>
              <View style={styles.cardHeader}>
                <Text style={styles.recordIndex}>#{index + 1}</Text>
                {item.date != null ? (
                  <Text style={styles.recordDate}>{String(item.date)}</Text>
                ) : null}
                {item.status != null ? (
                  <View
                    style={[
                      styles.statusPill,
                      item.status === "Approved" || item.status === "Verified"
                        ? styles.statusPillSuccess
                        : item.status === "Pending"
                        ? styles.statusPillWarning
                        : styles.statusPillDanger,
                    ]}
                  >
                    <Text style={styles.statusPillText}>{String(item.status)}</Text>
                  </View>
                ) : null}
              </View>

              {/* Dynamic primary attributes */}
              <View style={styles.recordDetails}>
                {Object.entries(item).map(([fieldKey, val]) => {
                  if (
                    fieldKey === "id" ||
                    fieldKey === "date" ||
                    fieldKey === "status" ||
                    val === null ||
                    val === undefined ||
                    val === ""
                  ) {
                    return null;
                  }

                  const matchedCol = columns.find((c) => c.key === fieldKey);
                  const label = matchedCol ? matchedCol.label : formatSummaryLabel(fieldKey);

                  return (
                    <View key={fieldKey} style={styles.attributeRow}>
                      <Text style={styles.attributeLabel}>{label}:</Text>
                      <Text style={styles.attributeValue} numberOfLines={2}>
                        {typeof val === "boolean" ? (val ? "Yes" : "No") : String(val)}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </Card>
          )}
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) {
              fetchNextPage();
            }
          }}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            isFetchingNextPage ? (
              <View style={styles.loadingMore}>
                <Loader message="Loading more entries..." />
              </View>
            ) : null
          }
        />
      )}

      {/* Export Bottom Sheet */}
      <ExportBottomSheet
        visible={isExportSheetVisible}
        onClose={() => setIsExportSheetVisible(false)}
        reportKey={reportKey}
        reportTitle={reportTitle}
        params={queryParams}
        scopeLabel={scopeLabel}
        totalRecords={totalRecords}
        isOnline={isOnline}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  exportBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: 6,
    borderRadius: radii.sm,
    gap: 4,
  },
  exportBtnDisabled: {
    backgroundColor: colors.textSecondary,
    opacity: 0.6,
  },
  exportBtnText: {
    ...typography.caption,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  offlineBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF3C7",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: "#FDE68A",
    gap: spacing.sm,
  },
  offlineBannerContent: {
    flex: 1,
  },
  offlineBannerTitle: {
    ...typography.caption,
    fontWeight: "700",
    color: "#92400E",
  },
  offlineBannerSubtitle: {
    ...typography.caption,
    fontSize: 10,
    color: "#78350F",
    marginTop: 1,
  },
  chipsBar: {
    backgroundColor: colors.surface,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  chipsRow: {
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#DCFCE7",
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 5,
    borderRadius: radii.sm,
    gap: 4,
  },
  filterChipText: {
    ...typography.caption,
    fontWeight: "700",
    color: colors.primaryDark,
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: spacing.xl * 2,
  },
  summarySection: {
    marginBottom: spacing.md,
  },
  summaryTitle: {
    ...typography.caption,
    fontWeight: "700",
    color: colors.navy,
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
    paddingHorizontal: 4,
  },
  kpiRow: {
    gap: spacing.sm,
    paddingBottom: spacing.xs,
  },
  kpiCard: {
    backgroundColor: "#DCFCE7",
    padding: spacing.md,
    borderRadius: radii.md,
    minWidth: 110,
    maxWidth: 160,
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  kpiValue: {
    ...typography.heading,
    color: colors.primaryDark,
    fontWeight: "700",
  },
  kpiLabel: {
    ...typography.caption,
    color: colors.navy,
    fontWeight: "600",
    fontSize: 11,
    marginTop: 2,
  },
  recordCountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
    paddingHorizontal: 4,
  },
  recordCountText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: "600",
  },
  recordCard: {
    marginBottom: spacing.sm,
    padding: spacing.md,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 6,
    marginBottom: 8,
  },
  recordIndex: {
    ...typography.caption,
    fontWeight: "700",
    color: colors.primary,
  },
  recordDate: {
    ...typography.caption,
    color: colors.navy,
    fontWeight: "600",
  },
  statusPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusPillSuccess: {
    backgroundColor: "#DCFCE7",
  },
  statusPillWarning: {
    backgroundColor: "#FEF3C7",
  },
  statusPillDanger: {
    backgroundColor: "#FEE2E2",
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.navy,
  },
  recordDetails: {
    gap: 4,
  },
  attributeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  attributeLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: "600",
    flex: 1,
  },
  attributeValue: {
    ...typography.caption,
    color: colors.navy,
    fontWeight: "700",
    flex: 1.5,
    textAlign: "right",
  },
  loadingMore: {
    paddingVertical: spacing.md,
  },
});
