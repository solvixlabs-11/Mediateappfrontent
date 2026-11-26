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
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import * as Sharing from "expo-sharing";
import { colors, radii, shadows, spacing, typography } from "../../../theme";
import { ScreenHeader } from "../../../shared/components/ScreenHeader";
import { Loader, EmptyState, ErrorState } from "../../../shared/components/StateViews";
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

  const getGroupIcon = (groupName: string): keyof typeof Feather.glyphMap => {
    switch (groupName) {
      case "Master Lists":
        return "list";
      case "Attendance and Daily Work":
        return "calendar";
      case "Visits":
        return "navigation";
      case "Doctor Analysis":
        return "activity";
      case "Stock and Orders":
        return "package";
      case "Sales and Finance":
        return "dollar-sign";
      default:
        return "file-text";
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScreenHeader
        title="Reports"
        subtitle="Operational analytics & coverage"
        variant="navy"
        onBack={navigation?.canGoBack && navigation.canGoBack() ? () => navigation.goBack() : undefined}
      />

      {/* Top Bar: Scope Chip & Count + Search Input */}
      <View style={styles.topBar}>
        <View style={styles.headerInfoRow}>
          <View style={styles.scopeChip}>
            <Feather name="shield" size={13} color={colors.brandBlue} />
            <Text style={styles.scopeChipText} numberOfLines={1}>
              {scopeLabel}
            </Text>
          </View>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{totalCount} reports</Text>
          </View>
        </View>

        <View style={styles.searchContainer}>
          <Feather name="search" size={17} color={colors.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search report by name or keyword..."
            placeholderTextColor={colors.textFaint}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Feather name="x-circle" size={16} color={colors.textMuted} />
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
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Feather name="bar-chart-2" size={32} color={colors.brandBlue} />
          </View>
          <Text style={styles.emptyTitle}>No Reports Found</Text>
          <Text style={styles.emptySubtitle}>
            {searchQuery.trim()
              ? `No reports match "${searchQuery}".`
              : "No reports are currently accessible for your role."}
          </Text>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={searchQuery ? () => setSearchQuery("") : () => { refetch(); }}
            activeOpacity={0.8}
          >
            <Text style={styles.refreshButtonText}>
              {searchQuery ? "Clear Search" : "Refresh"}
            </Text>
          </TouchableOpacity>
        </View>
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
              tintColor={colors.navy}
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
                    <View style={styles.groupIconBox}>
                      <Feather name={getGroupIcon(item.groupName)} size={16} color={colors.navy} />
                    </View>
                    <Text style={styles.groupTitle}>{item.groupName}</Text>
                    <View style={styles.groupCountBadge}>
                      <Text style={styles.groupCountText}>{item.items.length}</Text>
                    </View>
                  </View>
                  <Feather
                    name={isCollapsed ? "chevron-down" : "chevron-up"}
                    size={18}
                    color={colors.textMuted}
                  />
                </TouchableOpacity>

                {!isCollapsed &&
                  item.items.map((report) => {
                    const isComingSoon = report.is_ready === false || report.status !== "NOW";
                    return (
                      <View key={report.key} style={styles.reportCard}>
                        <TouchableOpacity
                          style={styles.reportTouchable}
                          activeOpacity={0.7}
                          onPress={() => handleSelectReport(report)}
                        >
                          <View style={styles.reportRowContent}>
                            <View
                              style={[
                                styles.reportIconBox,
                                isComingSoon ? styles.reportIconBoxDisabled : styles.reportIconBoxActive,
                              ]}
                            >
                              <Feather
                                name={getGroupIcon(item.groupName)}
                                size={18}
                                color={isComingSoon ? colors.textMuted : colors.brandBlue}
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
                                  <View style={styles.formatBadgePdf}>
                                    <Text style={styles.formatBadgePdfText}>PDF</Text>
                                  </View>
                                  <View style={styles.formatBadgeExcel}>
                                    <Text style={styles.formatBadgeExcelText}>Excel</Text>
                                  </View>
                                </View>
                              )}
                            </View>

                            <Feather
                              name="chevron-right"
                              size={18}
                              color={colors.textFaint}
                              style={styles.chevron}
                            />
                          </View>
                        </TouchableOpacity>
                      </View>
                    );
                  })}
              </View>
            );
          }}
          ListFooterComponent={
            recentExports.length > 0 ? (
              <View style={styles.recentsSection}>
                <View style={styles.recentsHeaderRow}>
                  <Feather name="clock" size={16} color={colors.navy} />
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
                      <Feather
                        name={exportItem.format === "pdf" ? "file-text" : "grid"}
                        size={18}
                        color={exportItem.format === "pdf" ? colors.accentRed : colors.teal}
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
                    <Feather name="share-2" size={16} color={colors.textMuted} />
                  </TouchableOpacity>
                ))}
              </View>
            ) : undefined
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topBar: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  headerInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  scopeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.bluePastel,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.full,
  },
  scopeChipText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.brandBlue,
  },
  countBadge: {
    backgroundColor: colors.tealPastel,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.full,
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.teal,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.inputBackground,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    height: 44,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.textInk,
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: 40,
  },
  groupSection: {
    marginBottom: spacing.md,
  },
  groupHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.xs + 2,
    ...shadows.sm,
  },
  groupHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  groupIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.bluePastel,
    alignItems: "center",
    justifyContent: "center",
  },
  groupTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.textInk,
  },
  groupCountBadge: {
    backgroundColor: colors.inputBackground,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radii.full,
  },
  groupCountText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textMuted,
  },
  reportCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    marginBottom: spacing.xs + 2,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  reportTouchable: {
    padding: spacing.md,
  },
  reportRowContent: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  reportIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  reportIconBoxActive: {
    backgroundColor: colors.bluePastel,
  },
  reportIconBoxDisabled: {
    backgroundColor: colors.inputBackground,
  },
  reportTextContainer: {
    flex: 1,
  },
  titleLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  reportTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textInk,
    flex: 1,
  },
  comingSoonTag: {
    backgroundColor: colors.orangePastel,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: radii.full,
  },
  comingSoonText: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.orange,
  },
  reportDesc: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 3,
    lineHeight: 16,
  },
  formatBadgesRow: {
    flexDirection: "row",
    gap: 6,
    marginTop: 8,
  },
  formatBadgePdf: {
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  formatBadgePdfText: {
    fontSize: 10,
    fontWeight: "800",
    color: colors.accentRed,
  },
  formatBadgeExcel: {
    backgroundColor: colors.tealPastel,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  formatBadgeExcelText: {
    fontSize: 10,
    fontWeight: "800",
    color: colors.teal,
  },
  chevron: {
    marginTop: 2,
    marginLeft: 6,
  },
  recentsSection: {
    marginTop: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  recentsHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  recentsTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.textInk,
  },
  recentsSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
    marginBottom: spacing.sm,
  },
  recentItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: colors.inputBackground,
  },
  recentFormatIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.inputBackground,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.sm,
  },
  recentInfo: {
    flex: 1,
  },
  recentTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textInk,
  },
  recentFilename: {
    fontSize: 11,
    color: colors.textMuted,
  },
  recentTime: {
    fontSize: 10,
    color: colors.textFaint,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: spacing.xl,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.bluePastel,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.textInk,
  },
  emptySubtitle: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: 6,
    lineHeight: 18,
  },
  refreshButton: {
    marginTop: spacing.md,
    backgroundColor: colors.navy,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: radii.lg,
  },
  refreshButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.surface,
  },
});
