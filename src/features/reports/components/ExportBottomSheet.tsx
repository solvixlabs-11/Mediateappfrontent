import React, { useState } from "react";
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radii, spacing, typography } from "../../../shared/theme/tokens";
import { Button } from "../../../shared/components/Button";
import { useReportExport, generateExportFileName } from "../hooks/useReportExport";
import { ReportQueryParams } from "../api/reportsApi";

export interface ExportBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  reportKey: string;
  reportTitle: string;
  params?: ReportQueryParams;
  scopeLabel?: string;
  totalRecords?: number;
  isOnline?: boolean;
}

export const ExportBottomSheet: React.FC<ExportBottomSheetProps> = ({
  visible,
  onClose,
  reportKey,
  reportTitle,
  params,
  scopeLabel,
  totalRecords,
  isOnline = true,
}) => {
  const [selectedFormat, setSelectedFormat] = useState<"xlsx" | "pdf">("xlsx");
  const { isExporting, progress, downloadAndShare, cancelExport } = useReportExport();

  const previewFileName = generateExportFileName(
    reportKey,
    selectedFormat,
    params?.from_date || params?.start_date,
    params?.to_date || params?.end_date,
    scopeLabel || "export"
  );

  const handleDownload = async () => {
    if (!isOnline) return;
    const success = await downloadAndShare({
      reportKey,
      reportTitle,
      format: selectedFormat,
      params,
      scopeLabel,
      totalRecords,
    });
    if (success) {
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={isExporting ? cancelExport : onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={isExporting ? undefined : onClose}
        />
        <View style={styles.sheetContainer}>
          <View style={styles.dragHandle} />

          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.headerTitles}>
              <Text style={styles.sheetTitle}>Export Report</Text>
              <Text style={styles.sheetSubtitle}>{reportTitle}</Text>
            </View>
            {!isExporting && (
              <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="close" size={24} color={colors.navy} />
              </TouchableOpacity>
            )}
          </View>

          {!isOnline && (
            <View style={styles.offlineNotice}>
              <Ionicons name="cloud-offline-outline" size={16} color={colors.warning} />
              <Text style={styles.offlineText}>
                Reports need internet to export live server documents.
              </Text>
            </View>
          )}

          {/* Format selection */}
          <Text style={styles.sectionLabel}>CHOOSE FORMAT</Text>
          <View style={styles.formatRow}>
            <TouchableOpacity
              style={[
                styles.formatCard,
                selectedFormat === "xlsx" && styles.formatCardSelected,
                !isOnline && styles.formatCardDisabled,
              ]}
              disabled={isExporting || !isOnline}
              onPress={() => setSelectedFormat("xlsx")}
              activeOpacity={0.8}
            >
              <Ionicons
                name="grid-outline"
                size={24}
                color={selectedFormat === "xlsx" ? colors.primary : colors.textSecondary}
              />
              <View style={styles.formatInfo}>
                <Text
                  style={[
                    styles.formatTitle,
                    selectedFormat === "xlsx" && styles.formatTitleSelected,
                  ]}
                >
                  Excel Spreadsheet (.xlsx)
                </Text>
                <Text style={styles.formatDesc}>Tabular data with freeze headers & formulas</Text>
              </View>
              {selectedFormat === "xlsx" && (
                <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.formatCard,
                selectedFormat === "pdf" && styles.formatCardSelected,
                !isOnline && styles.formatCardDisabled,
              ]}
              disabled={isExporting || !isOnline}
              onPress={() => setSelectedFormat("pdf")}
              activeOpacity={0.8}
            >
              <Ionicons
                name="document-text-outline"
                size={24}
                color={selectedFormat === "pdf" ? colors.primary : colors.textSecondary}
              />
              <View style={styles.formatInfo}>
                <Text
                  style={[
                    styles.formatTitle,
                    selectedFormat === "pdf" && styles.formatTitleSelected,
                  ]}
                >
                  PDF Document (.pdf)
                </Text>
                <Text style={styles.formatDesc}>Executive layout, branding, and KPI summaries</Text>
              </View>
              {selectedFormat === "pdf" && (
                <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
              )}
            </TouchableOpacity>
          </View>

          {/* File Name preview */}
          <View style={styles.filenameBox}>
            <Text style={styles.filenameLabel}>FILE NAME</Text>
            <Text style={styles.filenameText} numberOfLines={2}>
              {previewFileName}
            </Text>
          </View>

          {/* Progress or Actions */}
          {isExporting ? (
            <View style={styles.progressContainer}>
              <View style={styles.progressHeader}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={styles.progressText}>
                  Generating {selectedFormat.toUpperCase()} ({Math.round(progress * 100)}%)
                </Text>
              </View>
              <View style={styles.progressBarTrack}>
                <View style={[styles.progressBarFill, { width: `${Math.round(progress * 100)}%` }]} />
              </View>
              <Button
                title="Cancel Download"
                variant="danger"
                onPress={cancelExport}
                style={styles.cancelBtn}
              />
            </View>
          ) : (
            <View style={styles.actionButtons}>
              <Button
                title={isOnline ? `Download ${selectedFormat.toUpperCase()}` : "Export Disabled Offline"}
                variant="primary"
                disabled={!isOnline}
                onPress={handleDownload}
              />
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "flex-end",
  },
  backdrop: {
    flex: 1,
  },
  sheetContainer: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    padding: spacing.lg,
    paddingBottom: spacing.xl + 12,
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: spacing.md,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.md,
  },
  headerTitles: {
    flex: 1,
    marginRight: spacing.sm,
  },
  sheetTitle: {
    ...typography.title,
    color: colors.navy,
  },
  sheetSubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: 2,
  },
  offlineNotice: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF3C7",
    padding: spacing.sm,
    borderRadius: radii.sm,
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  offlineText: {
    ...typography.caption,
    color: "#92400E",
    flex: 1,
  },
  sectionLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: "700",
    marginBottom: spacing.xs,
    letterSpacing: 0.5,
  },
  formatRow: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  formatCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  formatCardSelected: {
    borderColor: colors.primary,
    backgroundColor: "#F0FDF4",
  },
  formatCardDisabled: {
    opacity: 0.5,
  },
  formatInfo: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  formatTitle: {
    ...typography.subheading,
    color: colors.navy,
  },
  formatTitleSelected: {
    color: colors.primaryDark,
    fontWeight: "700",
  },
  formatDesc: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  filenameBox: {
    backgroundColor: colors.background,
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  filenameLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: "600",
    marginBottom: 4,
  },
  filenameText: {
    ...typography.body,
    fontFamily: "monospace",
    color: colors.navy,
  },
  progressContainer: {
    paddingVertical: spacing.sm,
  },
  progressHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  progressText: {
    ...typography.body,
    color: colors.navy,
    fontWeight: "600",
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    overflow: "hidden",
    marginVertical: spacing.sm,
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  cancelBtn: {
    marginTop: spacing.sm,
  },
  actionButtons: {
    marginTop: spacing.xs,
  },
});
