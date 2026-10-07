import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  CustomerCoverageDto,
  MRPerformanceDto,
  ReportsDashboardDto,
  reportsApi,
} from "../api/reportsApi";
import { Header } from "../../../shared/components/Header";
import { Card } from "../../../shared/components/Card";
import { colors, radii, spacing, typography } from "../../../shared/theme/tokens";

interface ReportsScreenProps {
  onClose?: () => void;
}

export const ReportsScreen: React.FC<ReportsScreenProps> = ({ onClose }) => {
  const [data, setData] = useState<ReportsDashboardDto | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [timeRange, setTimeRange] = useState<"7D" | "30D" | "90D">("30D");

  const loadReports = useCallback(async () => {
    try {
      const today = new Date();
      let daysBack = 30;
      if (timeRange === "7D") daysBack = 7;
      if (timeRange === "90D") daysBack = 90;

      const startDate = new Date(today);
      startDate.setDate(today.getDate() - daysBack);

      const resp = await reportsApi.getDashboardReports({
        start_date: startDate.toISOString().split("T")[0],
        end_date: today.toISOString().split("T")[0],
      });
      setData(resp);
    } catch (err) {
      console.error("Failed to load reports:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [timeRange]);

  useEffect(() => {
    setIsLoading(true);
    loadReports();
  }, [loadReports]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadReports();
  };

  const renderCoverageBar = (cov: CustomerCoverageDto) => {
    const pct = Math.min(Math.max(cov.coverage_percentage, 0), 100);
    return (
      <View key={cov.customer_type} style={styles.coverageRow}>
        <View style={styles.coverageLabelRow}>
          <Text style={styles.coverageType}>{cov.customer_type}</Text>
          <Text style={styles.coverageStat}>
            {cov.visited_customers} / {cov.total_customers} ({cov.coverage_percentage}%)
          </Text>
        </View>
        <View style={styles.barBg}>
          <View style={[styles.barFill, { width: `${pct}%` }]} />
        </View>
      </View>
    );
  };

  const renderMRRow = (mr: MRPerformanceDto, index: number) => {
    return (
      <View key={mr.user_id} style={styles.mrCard}>
        <View style={styles.mrRankBadge}>
          <Text style={styles.mrRankText}>#{index + 1}</Text>
        </View>
        <View style={styles.mrInfo}>
          <Text style={styles.mrName}>{mr.user_name}</Text>
          <Text style={styles.mrTerritory}>{mr.territory_name || "General Territory"}</Text>
        </View>
        <View style={styles.mrMetrics}>
          <Text style={styles.mrMetricMain}>{mr.total_calls} Calls</Text>
          <Text style={styles.mrMetricSub}>₹{mr.total_pob.toLocaleString("en-IN")}</Text>
        </View>
        <View style={styles.mrCompliance}>
          <Text style={styles.complianceVal}>{mr.geofence_compliance}%</Text>
          <Text style={styles.complianceLbl}>GPS Verified</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Header
        title="Reports & Analytics"
        subtitle="Live field performance & territory coverage"
        showBack={!!onClose}
        onBack={onClose}
      />

      {/* Date Range Selector */}
      <View style={styles.timeRangeBar}>
        {(
          [
            { key: "7D", label: "Last 7 Days" },
            { key: "30D", label: "Last 30 Days" },
            { key: "90D", label: "Quarter to Date" },
          ] as const
        ).map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[styles.rangePill, timeRange === t.key && styles.rangePillActive]}
            onPress={() => setTimeRange(t.key)}
          >
            <Text style={[styles.rangePillText, timeRange === t.key && styles.rangePillTextActive]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Computing analytics and metrics...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={[colors.primary]}
            />
          }
        >
          {/* Summary KPI Cards Grid */}
          <View style={styles.kpiGrid}>
            <View style={styles.kpiCard}>
              <View style={[styles.kpiIconWrap, { backgroundColor: "#E0F2FE" }]}>
                <Ionicons name="call" size={20} color="#0369A1" />
              </View>
              <Text style={styles.kpiValue}>{data?.summary.total_calls || 0}</Text>
              <Text style={styles.kpiLabel}>Total Visits Done</Text>
              <Text style={styles.kpiSub}>
                {data?.summary.doctor_calls} Docs • {data?.summary.chemist_calls} Chem
              </Text>
            </View>

            <View style={styles.kpiCard}>
              <View style={[styles.kpiIconWrap, { backgroundColor: "#DCFCE7" }]}>
                <Ionicons name="cash" size={20} color={colors.success} />
              </View>
              <Text style={styles.kpiValue}>
                ₹{(data?.summary.total_pob || 0).toLocaleString("en-IN")}
              </Text>
              <Text style={styles.kpiLabel}>Total POB Value</Text>
              <Text style={styles.kpiSub}>Across booked orders</Text>
            </View>

            <View style={styles.kpiCard}>
              <View style={[styles.kpiIconWrap, { backgroundColor: "#FEF3C7" }]}>
                <Ionicons name="speedometer" size={20} color="#D97706" />
              </View>
              <Text style={styles.kpiValue}>{data?.summary.average_calls_per_day || 0}</Text>
              <Text style={styles.kpiLabel}>Daily Call Avg</Text>
              <Text style={styles.kpiSub}>Per active working day</Text>
            </View>

            <View style={styles.kpiCard}>
              <View style={[styles.kpiIconWrap, { backgroundColor: "#F3E8FF" }]}>
                <Ionicons name="navigate-circle" size={20} color="#7E22CE" />
              </View>
              <Text style={styles.kpiValue}>
                {data?.summary.geofence_compliance_rate || 0}%
              </Text>
              <Text style={styles.kpiLabel}>GPS Compliance</Text>
              <Text style={styles.kpiSub}>Verified at customer clinic</Text>
            </View>
          </View>

          {/* Customer Coverage Progress Section */}
          <Card style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Ionicons name="pie-chart-outline" size={18} color={colors.primary} />
              <Text style={styles.sectionTitle}>Customer Coverage & Reach</Text>
            </View>
            <View style={styles.coverageContainer}>
              {data?.customer_coverage.map(renderCoverageBar)}
            </View>
          </Card>

          {/* MR Performance Leaderboard */}
          <Card style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Ionicons name="trophy-outline" size={18} color="#D97706" />
              <Text style={styles.sectionTitle}>Field Force Performance Leaderboard</Text>
            </View>
            <View style={styles.mrList}>
              {data?.mr_performances && data.mr_performances.length > 0 ? (
                data.mr_performances.map(renderMRRow)
              ) : (
                <Text style={styles.emptyText}>No field rep activity recorded in this period.</Text>
              )}
            </View>
          </Card>
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  timeRangeBar: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rangePill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radii.full,
    backgroundColor: colors.greyLight,
    marginRight: spacing.sm,
  },
  rangePillActive: {
    backgroundColor: colors.navy,
  },
  rangePillText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  rangePillTextActive: {
    color: colors.surface,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: spacing.sm,
    color: colors.textSecondary,
    fontSize: 13,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: 40,
  },
  kpiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  kpiCard: {
    width: "48%",
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  kpiIconWrap: {
    width: 36,
    height: 36,
    borderRadius: radii.sm,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  kpiValue: {
    ...typography.heading,
    fontSize: 20,
    color: colors.textPrimary,
  },
  kpiLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textSecondary,
    marginTop: 2,
  },
  kpiSub: {
    fontSize: 10,
    color: colors.grey,
    marginTop: 2,
  },
  sectionCard: {
    marginBottom: spacing.md,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    paddingBottom: spacing.xs,
  },
  sectionTitle: {
    ...typography.subheading,
    fontSize: 15,
    color: colors.navy,
    marginLeft: spacing.xs,
  },
  coverageContainer: {
    marginTop: spacing.xs,
  },
  coverageRow: {
    marginBottom: spacing.md,
  },
  coverageLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  coverageType: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  coverageStat: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  barBg: {
    height: 8,
    borderRadius: 4,
    backgroundColor: "#E2E8F0",
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  mrList: {
    marginTop: spacing.xs,
  },
  mrCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  mrRankBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.sm,
  },
  mrRankText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.navy,
  },
  mrInfo: {
    flex: 1,
  },
  mrName: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  mrTerritory: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
  },
  mrMetrics: {
    alignItems: "flex-end",
    marginRight: spacing.md,
  },
  mrMetricMain: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.navy,
  },
  mrMetricSub: {
    fontSize: 11,
    color: colors.success,
    fontWeight: "600",
  },
  mrCompliance: {
    alignItems: "center",
    backgroundColor: "#F0FDF4",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: radii.sm,
    minWidth: 62,
  },
  complianceVal: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.success,
  },
  complianceLbl: {
    fontSize: 8,
    color: colors.textSecondary,
  },
  emptyText: {
    paddingVertical: spacing.md,
    textAlign: "center",
    color: colors.textSecondary,
    fontSize: 13,
  },
});
