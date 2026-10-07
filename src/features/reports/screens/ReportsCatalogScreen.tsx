import React, { useEffect } from "react";
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import * as Sharing from "expo-sharing";
import { Header } from "../../../shared/components/Header";
import { Card } from "../../../shared/components/Card";
import { ScreenContainer } from "../../../shared/components/ScreenContainer";
import { Loader, EmptyState, ErrorState } from "../../../shared/components/StateViews";
import { colors, radii, spacing, typography } from "../../../shared/theme/tokens";
import { ROUTES } from "../../../navigation/routes";
import { useReportsCatalog } from "../hooks/useReportsCatalog";
import { ReportCatalogItem } from "../api/reportsApi";
import { RecentExportItem } from "../services/reportsStorage";
import { useToastStore } from "../../../shared/components/Toast";

export function ReportsCatalogScreen() {
  const navigation = useNavigation<any>();
  const showToast = useToastStore((s) => s.showToast);

  const {
    isLoading,
    isError,
    errorMessage,
    refetch,
    scopeLabel,
    searchQuery,
    setSearchQuery,
    groupedReports,
    recentExports,
    loadRecentExports,
  } = useReportsCatalog();

  useEffect(() => {
    loadRecentExports();
  }, [loadRecentExports]);

  const handleSelectReport = (report: ReportCatalogItem) => {
    navigation.navigate(ROUTES.ReportFilters as any, {
      reportKey: report.key,
      reportTitle: report.title,
      filterSchema: report.filter_schema,
      scopeLabel,
    });
  };

  const handleShareRecentExport = async (item: RecentExportItem) => {
    try {
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(item.file_uri, {
          mimeType:
            item.format === "pdf"
              ? "application/pdf"
              : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          dialogTitle: `Share ${item.title}`,
        });
      } else {
        showToast("Sharing not supported on this device", "warning");
      }
    } catch {
      showToast("Unable to open exported file", "error");
    }
  };

  return (
    <ScreenContainer>
      <Header
        title="Reports & Analytics"
        subtitle="Operational metrics & official exports"
      />

      {/* Scope banner & Search bar */}
      <View style={styles.topBar}>
        <View style={styles.scopeChipContainer}>
          <View style={styles.scopeChip}>
            <Ionicons name="shield-checkmark" size={14} color={colors.primary} />
            <Text style={styles.scopeChipText} numberOfLines={1}>
              Showing: {scopeLabel}
            </Text>
          </View>
        </View>

        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color={colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search reports by name or keyword..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Content states */}
      {isLoading ? (
        <Loader message="Loading available reports..." />
      ) : isError ? (
        <ErrorState
          title="Unable to load reports"
          message={errorMessage || "Please verify your connection and permissions."}
          onRetry={refetch}
        />
      ) : groupedReports.length === 0 ? (
        <EmptyState
          title="No Reports Found"
          message={
            searchQuery.trim()
              ? `No reports match "${searchQuery}".`
              : "No reports are currently accessible for your role."
          }
          actionLabel={searchQuery ? "Clear Search" : "Refresh"}
          onAction={searchQuery ? () => setSearchQuery("") : refetch}
        />
      ) : (
        <FlatList
          data={groupedReports}
          keyExtractor={(item) => item.groupName}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={() => {
                refetch();
                loadRecentExports();
              }}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          renderItem={({ item }) => (
            <View style={styles.groupSection}>
              <View style={styles.groupHeaderRow}>
                <Ionicons
                  name={
                    item.groupName === "Activity"
                      ? "walk-outline"
                      : item.groupName === "Customers"
                      ? "people-outline"
                      : item.groupName === "HR and Expense"
                      ? "wallet-outline"
                      : "checkmark-circle-outline"
                  }
                  size={18}
                  color={colors.navy}
                />
                <Text style={styles.groupTitle}>{item.groupName}</Text>
                <View style={styles.groupCountBadge}>
                  <Text style={styles.groupCountText}>{item.items.length}</Text>
                </View>
              </View>

              {item.items.map((report) => (
                <Card key={report.key} style={styles.reportCard}>
                  <TouchableOpacity
                    style={styles.reportTouchable}
                    activeOpacity={0.7}
                    onPress={() => handleSelectReport(report)}
                  >
                    <View style={styles.reportHeader}>
                      <View style={styles.reportTitleRow}>
                        <Text style={styles.reportKeyBadge}>{report.key.toUpperCase()}</Text>
                        <Text style={styles.reportTitle} numberOfLines={1}>
                          {report.title}
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
                    </View>

                    <Text style={styles.reportDesc} numberOfLines={2}>
                      {report.description}
                    </Text>

                    <View style={styles.formatBadgesRow}>
                      <View style={styles.formatBadge}>
                        <Ionicons name="document-text" size={12} color="#047857" />
                        <Text style={styles.formatBadgeText}>PDF</Text>
                      </View>
                      <View style={[styles.formatBadge, { backgroundColor: "#EFF6FF" }]}>
                        <Ionicons name="grid" size={12} color="#1D4ED8" />
                        <Text style={[styles.formatBadgeText, { color: "#1D4ED8" }]}>Excel</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                </Card>
              ))}
            </View>
          )}
          ListFooterComponent={
            recentExports.length > 0 ? (
              <View style={styles.recentsSection}>
                <View style={styles.recentsHeaderRow}>
                  <Ionicons name="time-outline" size={18} color={colors.navy} />
                  <Text style={styles.recentsTitle}>Recent Exports (Last 10)</Text>
                </View>
                <Text style={styles.recentsSubtitle}>
                  Locally cached files ready to share or view
                </Text>

                {recentExports.map((exportItem, idx) => (
                  <TouchableOpacity
                    key={exportItem.id || idx}
                    style={styles.recentItem}
                    activeOpacity={0.7}
                    onPress={() => handleShareRecentExport(exportItem)}
                  >
                    <View style={styles.recentFormatIcon}>
                      <Ionicons
                        name={exportItem.format === "pdf" ? "document-text" : "grid"}
                        size={20}
                        color={exportItem.format === "pdf" ? "#DC2626" : "#059669"}
                      />
                    </View>
                    <View style={styles.recentInfo}>
                      <Text style={styles.recentTitle} numberOfLines={1}>
                        {exportItem.title}
                      </Text>
                      <Text style={styles.recentFilename} numberOfLines={1}>
                        {exportItem.file_name}
                      </Text>
                      <Text style={styles.recentTime}>
                        {new Date(exportItem.exported_at).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </Text>
                    </View>
                    <Ionicons name="share-social-outline" size={20} color={colors.primary} />
                  </TouchableOpacity>
                ))}
              </View>
            ) : null
          }
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  topBar: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  scopeChipContainer: {
    flexDirection: "row",
    marginBottom: spacing.sm,
  },
  scopeChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#DCFCE7",
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: radii.sm,
    gap: 4,
  },
  scopeChipText: {
    ...typography.caption,
    fontWeight: "700",
    color: colors.primaryDark,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.background,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchIcon: {
    marginRight: spacing.xs,
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    color: colors.navy,
    paddingVertical: 2,
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: spacing.xl * 2,
  },
  groupSection: {
    marginBottom: spacing.lg,
  },
  groupHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.xs,
    paddingHorizontal: 4,
    gap: spacing.xs,
  },
  groupTitle: {
    ...typography.subheading,
    color: colors.navy,
    fontWeight: "700",
  },
  groupCountBadge: {
    backgroundColor: colors.border,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
    marginLeft: 4,
  },
  groupCountText: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: "700",
    color: colors.navy,
  },
  reportCard: {
    marginBottom: spacing.sm,
    padding: 0,
    overflow: "hidden",
  },
  reportTouchable: {
    padding: spacing.md,
  },
  reportHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  reportTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: spacing.xs,
  },
  reportKeyBadge: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.primary,
    backgroundColor: "#E6F4F1",
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  reportTitle: {
    ...typography.bodyMedium,
    color: colors.navy,
    flex: 1,
  },
  reportDesc: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    lineHeight: 16,
  },
  formatBadgesRow: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  formatBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 3,
  },
  formatBadgeText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#047857",
  },
  recentsSection: {
    marginTop: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  recentsHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginBottom: 2,
  },
  recentsTitle: {
    ...typography.subheading,
    color: colors.navy,
    fontWeight: "700",
  },
  recentsSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  recentItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  recentFormatIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.sm,
  },
  recentInfo: {
    flex: 1,
  },
  recentTitle: {
    ...typography.bodyMedium,
    color: colors.navy,
  },
  recentFilename: {
    ...typography.caption,
    fontFamily: "monospace",
    color: colors.textSecondary,
    fontSize: 11,
  },
  recentTime: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 10,
    marginTop: 1,
  },
});
