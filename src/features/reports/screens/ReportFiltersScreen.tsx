import React, { useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Modal,
  FlatList,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { Header } from "../../../shared/components/Header";
import { Card } from "../../../shared/components/Card";
import { Button } from "../../../shared/components/Button";
import { Input } from "../../../shared/components/Input";
import { ScreenContainer } from "../../../shared/components/ScreenContainer";
import { colors, radii, spacing, typography } from "../../../shared/theme/tokens";
import { ROUTES } from "../../../navigation/routes";
import { useReportFilters } from "../hooks/useReportFilters";
import { DatePreset } from "../utils/reportDateUtils";
import { ReportFilterSchema } from "../api/reportsApi";
import { mastersApi } from "../../masters/api/mastersApi";

const DATE_PRESETS: DatePreset[] = [
  "Today",
  "Yesterday",
  "This week",
  "This month",
  "Last month",
  "Custom",
];

export function ReportFiltersScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  // Dynamic filter options fetched from backend API
  const [customerTypes, setCustomerTypes] = useState<Array<{ label: string; value: string | null }>>([
    { label: "All Types", value: null },
  ]);
  const [statusOptions, setStatusOptions] = useState<Array<{ label: string; value: string | null }>>([
    { label: "All Statuses", value: null },
  ]);

  useEffect(() => {
    mastersApi
      .listItems("CUSTOMER_TYPE")
      .then((res) => {
        if (res && res.length > 0) {
          setCustomerTypes([
            { label: "All Types", value: null },
            ...res.map((i) => ({ label: i.name, value: i.code })),
          ]);
        }
      })
      .catch(() => {});

    mastersApi
      .listItems("APPROVAL_STATUS")
      .then((res) => {
        if (res && res.length > 0) {
          setStatusOptions([
            { label: "All Statuses", value: null },
            ...res.map((i) => ({ label: i.name, value: i.code })),
          ]);
        }
      })
      .catch(() => {});
  }, []);

  const { reportKey, reportTitle, filterSchema, scopeLabel, existingFilters } =
    route.params || {};

  const {
    role,
    preset,
    fromDate,
    toDate,
    dateError,
    handleSelectPreset,
    handleSetCustomDates,

    canPickMr,
    selectedMrId,
    selectedMrName,
    setSelectedMr,
    availableMrs,

    canPickManager,
    selectedManagerId,
    selectedManagerName,
    setSelectedManager,
    availableManagers,

    canPickTerritory,
    selectedTerritoryId,
    selectedTerritoryName,
    setSelectedTerritory,
    availableTerritories,

    canPickCustomerType,
    selectedCustomerType,
    setSelectedCustomerType,

    canPickStatus,
    selectedStatus,
    setSelectedStatus,

    canPickCategory,
    selectedCategory,
    setSelectedCategory,

    canPickSpecialization,
    selectedSpecialization,
    setSelectedSpecialization,

    canPickActive,
    selectedActive,
    setSelectedActive,

    canPickWorkType,
    selectedWorkType,
    setSelectedWorkType,

    canPickDeviationType,
    selectedDeviationType,
    setSelectedDeviationType,

    filterState,
    isValid,
  } = useReportFilters(filterSchema as ReportFilterSchema, existingFilters);

  // Modal pickers
  const [activePickerModal, setActivePickerModal] = useState<
    "MR" | "MANAGER" | "TERRITORY" | null
  >(null);

  const handleApply = () => {
    navigation.navigate(ROUTES.ReportResult as any, {
      reportKey,
      reportTitle,
      filterSchema,
      scopeLabel,
      filters: filterState,
    });
  };

  return (
    <ScreenContainer>
      <Header
        title="Report Filters"
        subtitle={reportTitle}
        showBack
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Date Presets Section */}
        {filterSchema?.date_range !== false && (
          <Card style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Ionicons name="calendar-outline" size={18} color={colors.primary} />
              <Text style={styles.sectionTitle}>DATE RANGE</Text>
            </View>

          <View style={styles.presetsGrid}>
            {DATE_PRESETS.map((p) => {
              const isSelected = preset === p;
              return (
                <TouchableOpacity
                  key={p}
                  style={[styles.presetChip, isSelected && styles.presetChipSelected]}
                  onPress={() => handleSelectPreset(p)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.presetChipText,
                      isSelected && styles.presetChipTextSelected,
                    ]}
                  >
                    {p}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Custom Date Inputs */}
          <View style={styles.dateInputsRow}>
            <View style={styles.dateFieldWrapper}>
              <Input
                label="Start Date (YYYY-MM-DD)"
                value={fromDate}
                placeholder="2026-10-01"
                onChangeText={(val) => handleSetCustomDates(val, toDate)}
              />
            </View>
            <View style={styles.dateFieldWrapper}>
              <Input
                label="End Date (YYYY-MM-DD)"
                value={toDate}
                placeholder="2026-10-31"
                onChangeText={(val) => handleSetCustomDates(fromDate, val)}
              />
            </View>
          </View>

          {dateError ? (
            <View style={styles.errorNotice}>
              <Ionicons name="alert-circle" size={16} color={colors.danger} />
              <Text style={styles.errorText}>{dateError}</Text>
            </View>
          ) : (
            <Text style={styles.helperText}>
              Maximum range is 92 days. Values are formatted in Asia/Kolkata timezone.
            </Text>
          )}
        </Card>
      )}

      {/* Hierarchy Filters (Manager & MR) */}
        {role !== "MR" && (
          <Card style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Ionicons name="people-outline" size={18} color={colors.primary} />
              <Text style={styles.sectionTitle}>TEAM & REPRESENTATIVE</Text>
            </View>

            {/* Admin: Manager Picker */}
            {canPickManager && (
              <View style={styles.pickerField}>
                <Text style={styles.fieldLabel}>Reporting Manager</Text>
                <TouchableOpacity
                  style={styles.pickerButton}
                  onPress={() => setActivePickerModal("MANAGER")}
                >
                  <Text style={styles.pickerButtonText}>
                    {selectedManagerName || "All Managers"}
                  </Text>
                  <Ionicons name="chevron-down" size={18} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
            )}

            {/* Manager & Admin: MR Picker */}
            {canPickMr && (
              <View style={styles.pickerField}>
                <Text style={styles.fieldLabel}>
                  {role === "MANAGER" ? "Team Member (MR)" : "Medical Representative"}
                </Text>
                <TouchableOpacity
                  style={styles.pickerButton}
                  onPress={() => setActivePickerModal("MR")}
                >
                  <Text style={styles.pickerButtonText}>
                    {selectedMrName || (role === "MANAGER" ? "All My Team" : "All Representatives")}
                  </Text>
                  <Ionicons name="chevron-down" size={18} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
            )}
          </Card>
        )}

        {/* Territory Filter */}
        {canPickTerritory && (
          <Card style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Ionicons name="map-outline" size={18} color={colors.primary} />
              <Text style={styles.sectionTitle}>TERRITORY</Text>
            </View>
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => setActivePickerModal("TERRITORY")}
            >
              <Text style={styles.pickerButtonText}>
                {selectedTerritoryName || "All Assigned Territories"}
              </Text>
              <Ionicons name="chevron-down" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </Card>
        )}

        {/* Customer Type Filter */}
        {canPickCustomerType && (
          <Card style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Ionicons name="medkit-outline" size={18} color={colors.primary} />
              <Text style={styles.sectionTitle}>CUSTOMER TYPE</Text>
            </View>
            <View style={styles.chipsRow}>
              {customerTypes.map((ct) => {
                const isSelected = selectedCustomerType === ct.value;
                return (
                  <TouchableOpacity
                    key={ct.label}
                    style={[styles.typeChip, isSelected && styles.typeChipSelected]}
                    onPress={() => setSelectedCustomerType(ct.value)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.typeChipText,
                        isSelected && styles.typeChipTextSelected,
                      ]}
                    >
                      {ct.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Card>
        )}

        {/* Status Filter */}
        {canPickStatus && (
          <Card style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Ionicons name="flag-outline" size={18} color={colors.primary} />
              <Text style={styles.sectionTitle}>STATUS</Text>
            </View>
            <View style={styles.chipsRow}>
              {statusOptions.map((st) => {
                const isSelected = selectedStatus === st.value;
                return (
                  <TouchableOpacity
                    key={st.label}
                    style={[styles.typeChip, isSelected && styles.typeChipSelected]}
                    onPress={() => setSelectedStatus(st.value)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.typeChipText,
                        isSelected && styles.typeChipTextSelected,
                      ]}
                    >
                      {st.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Card>
        )}

        {/* Category Filter */}
        {canPickCategory && (
          <Card style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Ionicons name="pricetag-outline" size={18} color={colors.primary} />
              <Text style={styles.sectionTitle}>CATEGORY</Text>
            </View>
            <View style={styles.chipsRow}>
              {[
                { label: "All Categories", value: null },
                { label: "Category A", value: "A" },
                { label: "Category B", value: "B" },
                { label: "Category C", value: "C" },
              ].map((c) => {
                const isSelected = selectedCategory === c.value;
                return (
                  <TouchableOpacity
                    key={c.label}
                    style={[styles.typeChip, isSelected && styles.typeChipSelected]}
                    onPress={() => setSelectedCategory(c.value)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.typeChipText,
                        isSelected && styles.typeChipTextSelected,
                      ]}
                    >
                      {c.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Card>
        )}

        {/* Work Type Filter */}
        {canPickWorkType && (
          <Card style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Ionicons name="briefcase-outline" size={18} color={colors.primary} />
              <Text style={styles.sectionTitle}>WORK TYPE</Text>
            </View>
            <View style={styles.chipsRow}>
              {[
                { label: "All Work Types", value: null },
                { label: "Field Work", value: "PRESENT" },
                { label: "Half Day", value: "HALF_DAY" },
                { label: "Leave", value: "LEAVE" },
              ].map((w) => {
                const isSelected = selectedWorkType === w.value;
                return (
                  <TouchableOpacity
                    key={w.label}
                    style={[styles.typeChip, isSelected && styles.typeChipSelected]}
                    onPress={() => setSelectedWorkType(w.value)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.typeChipText,
                        isSelected && styles.typeChipTextSelected,
                      ]}
                    >
                      {w.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Card>
        )}

        {/* Active Status Filter */}
        {canPickActive && (
          <Card style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Ionicons name="checkmark-circle-outline" size={18} color={colors.primary} />
              <Text style={styles.sectionTitle}>ACTIVE STATUS</Text>
            </View>
            <View style={styles.chipsRow}>
              {[
                { label: "All", value: null },
                { label: "Active Only", value: true },
                { label: "Inactive Only", value: false },
              ].map((a) => {
                const isSelected = selectedActive === a.value;
                return (
                  <TouchableOpacity
                    key={a.label}
                    style={[styles.typeChip, isSelected && styles.typeChipSelected]}
                    onPress={() => setSelectedActive(a.value)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.typeChipText,
                        isSelected && styles.typeChipTextSelected,
                      ]}
                    >
                      {a.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Card>
        )}

        {/* Deviation Type Filter */}
        {canPickDeviationType && (
          <Card style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Ionicons name="alert-circle-outline" size={18} color={colors.primary} />
              <Text style={styles.sectionTitle}>DEVIATION TYPE</Text>
            </View>
            <View style={styles.chipsRow}>
              {[
                { label: "All Deviations", value: null },
                { label: "Missed Call", value: "Missed Call" },
                { label: "Unplanned Call", value: "Unplanned Call" },
              ].map((d) => {
                const isSelected = selectedDeviationType === d.value;
                return (
                  <TouchableOpacity
                    key={d.label}
                    style={[styles.typeChip, isSelected && styles.typeChipSelected]}
                    onPress={() => setSelectedDeviationType(d.value)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.typeChipText,
                        isSelected && styles.typeChipTextSelected,
                      ]}
                    >
                      {d.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Card>
        )}

        {/* Apply Action */}
        <View style={styles.actionContainer}>
          <Button
            title="Generate Report"
            variant="primary"
            disabled={!isValid || Boolean(dateError)}
            onPress={handleApply}
          />
        </View>
      </ScrollView>

      {/* Modal Pickers for Selection */}
      <Modal
        visible={activePickerModal !== null}
        animationType="slide"
        transparent
        onRequestClose={() => setActivePickerModal(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {activePickerModal === "MR"
                  ? "Select Medical Representative"
                  : activePickerModal === "MANAGER"
                  ? "Select Reporting Manager"
                  : "Select Territory"}
              </Text>
              <TouchableOpacity onPress={() => setActivePickerModal(null)}>
                <Ionicons name="close" size={24} color={colors.navy} />
              </TouchableOpacity>
            </View>

            {/* List options */}
            {activePickerModal === "MR" && (
              <FlatList
                data={[{ id: null, name: role === "MANAGER" ? "All My Team" : "All Representatives" }, ...availableMrs]}
                keyExtractor={(item) => String(item.id ?? "all")}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.modalOption,
                      selectedMrId === item.id && styles.modalOptionSelected,
                    ]}
                    onPress={() => {
                      setSelectedMr(item.id, item.id ? item.name : undefined);
                      setActivePickerModal(null);
                    }}
                  >
                    <Text
                      style={[
                        styles.modalOptionText,
                        selectedMrId === item.id && styles.modalOptionTextSelected,
                      ]}
                    >
                      {item.name}
                    </Text>
                    {selectedMrId === item.id && (
                      <Ionicons name="checkmark" size={18} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                )}
              />
            )}

            {activePickerModal === "MANAGER" && (
              <FlatList
                data={[{ id: null, name: "All Managers" }, ...availableManagers]}
                keyExtractor={(item) => String(item.id ?? "all")}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.modalOption,
                      selectedManagerId === item.id && styles.modalOptionSelected,
                    ]}
                    onPress={() => {
                      setSelectedManager(item.id, item.id ? item.name : undefined);
                      setActivePickerModal(null);
                    }}
                  >
                    <Text
                      style={[
                        styles.modalOptionText,
                        selectedManagerId === item.id && styles.modalOptionTextSelected,
                      ]}
                    >
                      {item.name}
                    </Text>
                    {selectedManagerId === item.id && (
                      <Ionicons name="checkmark" size={18} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                )}
              />
            )}

            {activePickerModal === "TERRITORY" && (
              <FlatList
                data={[{ id: null, name: "All Assigned Territories" }, ...availableTerritories]}
                keyExtractor={(item) => String(item.id ?? "all")}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.modalOption,
                      selectedTerritoryId === item.id && styles.modalOptionSelected,
                    ]}
                    onPress={() => {
                      setSelectedTerritory(item.id, item.id ? item.name : undefined);
                      setActivePickerModal(null);
                    }}
                  >
                    <Text
                      style={[
                        styles.modalOptionText,
                        selectedTerritoryId === item.id && styles.modalOptionTextSelected,
                      ]}
                    >
                      {item.name}
                    </Text>
                    {selectedTerritoryId === item.id && (
                      <Ionicons name="checkmark" size={18} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xl * 2,
  },
  sectionCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    ...typography.caption,
    fontWeight: "700",
    color: colors.navy,
    letterSpacing: 0.5,
  },
  presetsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  presetChip: {
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: 6,
    borderRadius: radii.sm,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  presetChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  presetChipText: {
    ...typography.caption,
    color: colors.navy,
    fontWeight: "600",
  },
  presetChipTextSelected: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  dateInputsRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  dateFieldWrapper: {
    flex: 1,
  },
  helperText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  errorNotice: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginTop: 4,
  },
  errorText: {
    ...typography.caption,
    color: colors.danger,
    fontWeight: "600",
  },
  pickerField: {
    marginBottom: spacing.sm,
  },
  fieldLabel: {
    ...typography.caption,
    fontWeight: "600",
    color: colors.navy,
    marginBottom: 4,
  },
  pickerButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  pickerButtonText: {
    ...typography.body,
    color: colors.navy,
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  typeChip: {
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: 6,
    borderRadius: radii.sm,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  typeChipSelected: {
    backgroundColor: "#DCFCE7",
    borderColor: colors.primary,
  },
  typeChipText: {
    ...typography.caption,
    color: colors.navy,
  },
  typeChipTextSelected: {
    color: colors.primaryDark,
    fontWeight: "700",
  },
  actionContainer: {
    marginTop: spacing.md,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    maxHeight: "70%",
    padding: spacing.lg,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: spacing.sm,
  },
  modalTitle: {
    ...typography.heading,
    color: colors.navy,
  },
  modalOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalOptionSelected: {
    backgroundColor: "#F0FDF4",
    marginHorizontal: -spacing.md,
    paddingHorizontal: spacing.md,
  },
  modalOptionText: {
    ...typography.body,
    color: colors.navy,
  },
  modalOptionTextSelected: {
    fontWeight: "700",
    color: colors.primaryDark,
  },
});
