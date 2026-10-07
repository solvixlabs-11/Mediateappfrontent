import React, { useEffect, useState } from "react";
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

  // Collapsible section state (all expanded by default)
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadRecentExports();
  }, [loadRecentExports]);

  const toggleSection = (groupName: string) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [groupName]: !prev[groupName],
    }));
  };

  const handleSelectReport = (report: ReportCatalogItem) => {
    if (report.is_ready === false || report.status !== "NOW") {
      navigation.navigate(ROUTES.ComingSoon as any, {
        reportTitle: report.title,
        featureName: report.title,
        group: report.group,
        phase: `Coming Soon (${report.status || "Planned"})`,
        status: report.status || "Coming Soon",
        reason:
          report.coming_soon_reason ||
          "This report requires upcoming operational or transaction modules before activation.",
      });
      return;
    }

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

  // Compute total visible report count
  const totalCount = groupedReports.reduce((acc, g) => acc + g.items.length, 0);

  const getGroupIcon = (groupName: string): keyof typeof Ionicons.glyphMap => {
    switch (groupName) {
      case "Master Lists":
        return "list-circle-outline";
      case "Attendance and Daily Work":
        return "calendar-outline";
      case "Visits":
        return "footsteps-outline";
      case "Doctor Analysis":
        return "medkit-outline";
      case "Stock and Orders":
        return "cube-outline";
      case "Sales and Finance":
        return "cash-outline";
      default:
        return "document-text-outline";
    }
  };

  const getReportIcon = (groupName: string): keyof typeof Ionicons.glyphMap => {
    switch (groupName) {
      case "Master Lists":
        return "document-text-outline";
      case "Attendance and Daily Work":
        return "time-outline";
      case "Visits":
        return "location-outline";
      case "Doctor Analysis":
        return "heart-outline";
      case "Stock and Orders":
        return "cart-outline";
      case "Sales and Finance":
        return "trending-up-outline";
      default:
        return "reader-outline";
    }
  };

  return (
    <ScreenContainer>
      <Header
        title="Reports"
        subtitle="Official reports & operational analytics"
        showBack={navigation?.canGoBack ? navigation.canGoBack() : false}
        onBack={() => navigation?.goBack?.()}
      />

      {/* Top Bar: Scope Chip & Count + Search Input */}
      <View style={styles.topBar}>
        <View style={styles.headerInfoRow}>
          <View style={styles.scopeChip}>
            <Ionicons name="shield-checkmark" size={14} color={colors.primary} />
            <Text style={styles.scopeChipText} numberOfLines={1}>
              {scopeLabel}
            </Text>
          </View>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{totalCount} reports</Text>
          </View>
        </View>

        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color={colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search report by name or keyword..."
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
        <Loader message="Loading reports catalog..." />
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
          renderItem={({ item }) => {
            const isCollapsed = !!collapsedSections[item.groupName];
            return (
              <View style={styles.groupSection}>
                {/* Collapsible Section Header */}
                <TouchableOpacity
                  style={styles.groupHeaderRow}
                  activeOpacity={0.7}
                  onPress={() => toggleSection(item.groupName)}
                >
                  <View style={styles.groupHeaderLeft}>
                    <Ionicons name={getGroupIcon(item.groupName)} size={18} color={colors.navy} />
                    <Text style={styles.groupTitle}>{item.groupName}</Text>
                    <View style={styles.groupCountBadge}>
                      <Text style={styles.groupCountText}>{item.items.length}</Text>
                    </View>
                  </View>
                  <Ionicons
                    name={isCollapsed ? "chevron-down" : "chevron-up"}
                    size={18}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>

                {!isCollapsed &&
                  item.items.map((report) => {
                    const isComingSoon = report.is_ready === false || report.status !== "NOW";
                    return (
                      <Card key={report.key} style={styles.reportCard}>
                        <TouchableOpacity
                          style={styles.reportTouchable}
                          activeOpacity={0.7}
                          onPress={() => handleSelectReport(report)}
                        >
                          <View style={styles.reportRowContent}>
                            <View
                              style={[
                                styles.reportIconBox,
                                isComingSoon && styles.reportIconBoxDisabled,
                              ]}
                            >
                              <Ionicons
                                name={getReportIcon(item.groupName)}
                                size={18}
                                color={isComingSoon ? colors.textSecondary : colors.primary}
                              />
                            </View>

                            <View style={styles.reportTextContainer}>
                              <View style={styles.titleLine}>
                                <Text style={styles.reportTitle} numberOfLines={2}>
                                  {report.title}
                                </Text>
                                {isComingSoon ? (
                                  <View style={styles.comingSoonTag}>
                                    <Text style={styles.comingSoonText}>
                                      Coming soon
                                    </Text>
                                  </View>
                                ) : null}
                              </View>

                              <Text style={styles.reportDesc} numberOfLines={2}>
                                {report.description}
                              </Text>

                              {!isComingSoon && (
                                <View style={styles.formatBadgesRow}>
                                  <View style={styles.formatBadge}>
                                    <Ionicons name="document-text" size={11} color="#047857" />
                                    <Text style={styles.formatBadgeText}>PDF</Text>
                                  </View>
                                  <View style={[styles.formatBadge, { backgroundColor: "#EFF6FF" }]}>
                                    <Ionicons name="grid" size={11} color="#1D4ED8" />
                                    <Text style={[styles.formatBadgeText, { color: "#1D4ED8" }]}>Excel</Text>
                                  </View>
                                </View>
                              )}
                            </View>

                            <Ionicons
                              name="chevron-forward"
                              size={18}
                              color={colors.textSecondary}
                              style={styles.chevron}
                            />
                          </View>
                        </TouchableOpacity>
                      </Card>
                    );
                  })}
              </View>
            );
          }}
          ListFooterComponent={
            recentExports.length > 0 ? (
              <View style={styles.recentsSection}>
                <View style={styles.recentsHeaderRow}>
                  <Ionicons name="time-outline" size={18} color={colors.navy} />
                  <Text style={styles.recentsTitle}>Recent Exports</Text>
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
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.xs,
  },
  scopeChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#DCFCE7",
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radii.sm,
    gap: 4,
    flexShrink: 1,
  },
  scopeChipText: {
    ...typography.caption,
    fontWeight: "700",
    color: colors.primaryDark,
  },
  countBadge: {
    backgroundColor: colors.border,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  countBadgeText: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: "700",
    color: colors.navy,
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
    marginTop: 4,
  },
  searchIcon: {
    marginRight: spacing.xs,
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    fontSize: 14,
    color: colors.navy,
    paddingVertical: 2,
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: spacing.xl * 2,
  },
  groupSection: {
    marginBottom: spacing.md,
  },
  groupHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: 4,
    marginBottom: 6,
  },
  groupHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  groupTitle: {
    ...typography.subheading,
    fontSize: 15,
    color: colors.navy,
    fontWeight: "700",
  },
  groupCountBadge: {
    backgroundColor: colors.border,
    paddingHorizontal: 7,
    paddingVertical: 1,
    borderRadius: 10,
    marginLeft: 2,
  },
  groupCountText: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: "700",
    color: colors.navy,
  },
  reportCard: {
    marginBottom: 8,
    padding: 0,
    borderRadius: radii.md,
    overflow: "hidden",
  },
  reportTouchable: {
    padding: spacing.md,
  },
  reportRowContent: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  reportIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#E6F4F1",
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.sm,
    marginTop: 2,
  },
  reportIconBoxDisabled: {
    backgroundColor: colors.border,
  },
  reportTextContainer: {
    flex: 1,
  },
  titleLine: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 3,
    flexWrap: "wrap",
    gap: 6,
  },
  reportTitle: {
    ...typography.bodyMedium,
    fontWeight: "700",
    fontSize: 15,
    color: colors.navy,
    flexShrink: 1,
  },
  comingSoonTag: {
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  comingSoonText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#B45309",
  },
  reportDesc: {
    ...typography.caption,
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 6,
    lineHeight: 16,
  },
  formatBadgesRow: {
    flexDirection: "row",
    gap: spacing.xs,
    marginTop: 2,
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
  chevron: {
    marginLeft: spacing.xs,
    marginTop: 8,
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
