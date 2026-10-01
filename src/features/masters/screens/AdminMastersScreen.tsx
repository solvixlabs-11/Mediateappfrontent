import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useMasterStore } from "../store";
import { MasterItemDto, mastersApi } from "../api/mastersApi";
import { TerritoryDto, territoriesApi } from "../../territories/api/territoriesApi";
import { colors, radii, spacing, typography } from "../../../shared/theme/tokens";

type SectionType = "SPECIALIZATIONS" | "TERRITORIES" | "CATEGORIES" | "GEOGRAPHY";

export function AdminMastersScreen() {
  const { specializations, customerCategories, states, territories, fetchMasters, isLoading } =
    useMasterStore();

  const [activeSection, setActiveSection] = useState<SectionType>("SPECIALIZATIONS");
  const [allTerritories, setAllTerritories] = useState<TerritoryDto[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // New Item Modal
  const [modalVisible, setModalVisible] = useState(false);
  const [newCode, setNewCode] = useState("");
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // New Territory Modal
  const [territoryModalVisible, setTerritoryModalVisible] = useState(false);
  const [tName, setTName] = useState("");
  const [tCode, setTCode] = useState("");
  const [tHq, setTHq] = useState("");

  const loadTerritories = async () => {
    try {
      const data = await territoriesApi.listTerritories({ limit: 100 });
      setAllTerritories(data);
    } catch {
      // fallback to store
      setAllTerritories(territories);
    }
  };

  useEffect(() => {
    fetchMasters();
    loadTerritories();
  }, [fetchMasters]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([fetchMasters(true), loadTerritories()]);
    setIsRefreshing(false);
  };

  const handleCreateMasterItem = async () => {
    if (!newCode.trim() || !newName.trim()) {
      Alert.alert("Validation", "Code and Name are required.");
      return;
    }

    setIsSaving(true);
    try {
      await mastersApi.createItem({
        type: activeSection === "SPECIALIZATIONS" ? "SPECIALIZATION" : "CUSTOMER_CATEGORY",
        code: newCode.trim().toUpperCase(),
        name: newName.trim(),
        description: newDesc.trim() || undefined,
      });

      Alert.alert("Success", "Master item created successfully!");
      setModalVisible(false);
      setNewCode("");
      setNewName("");
      setNewDesc("");
      fetchMasters(true);
    } catch (err: any) {
      Alert.alert("Error", err?.response?.data?.detail || "Failed to create item.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateTerritory = async () => {
    if (!tName.trim() || !tCode.trim() || !tHq.trim()) {
      Alert.alert("Validation", "Name, Code, and Headquarters are required.");
      return;
    }

    setIsSaving(true);
    try {
      await territoriesApi.createTerritory({
        name: tName.trim(),
        code: tCode.trim().toUpperCase(),
        headquarters: tHq.trim(),
      });

      Alert.alert("Success", "Territory created successfully!");
      setTerritoryModalVisible(false);
      setTName("");
      setTCode("");
      setTHq("");
      loadTerritories();
    } catch (err: any) {
      Alert.alert("Error", err?.response?.data?.detail || "Failed to create territory.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Masters & Geography</Text>
          <Text style={styles.subtitle}>System configuration & dropdown registries</Text>
        </View>

        {activeSection === "TERRITORIES" ? (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setTerritoryModalVisible(true)}
          >
            <Ionicons name="add" size={18} color="#fff" />
            <Text style={styles.addButtonText}>Add Territory</Text>
          </TouchableOpacity>
        ) : activeSection === "SPECIALIZATIONS" ? (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setModalVisible(true)}
          >
            <Ionicons name="add" size={18} color="#fff" />
            <Text style={styles.addButtonText}>Add Spec</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Segment Selector */}
      <View style={styles.segmentContainer}>
        {(
          [
            { id: "SPECIALIZATIONS", label: "Specializations" },
            { id: "TERRITORIES", label: "Territories" },
            { id: "CATEGORIES", label: "Doctor Tiers" },
            { id: "GEOGRAPHY", label: "States & HQ" },
          ] as const
        ).map((seg) => {
          const isActive = activeSection === seg.id;
          return (
            <TouchableOpacity
              key={seg.id}
              style={[styles.segTab, isActive && styles.segTabActive]}
              onPress={() => setActiveSection(seg.id)}
            >
              <Text style={[styles.segText, isActive && styles.segTextActive]}>
                {seg.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Content */}
      {isLoading && !isRefreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : activeSection === "SPECIALIZATIONS" ? (
        <FlatList
          data={specializations}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
          }
          renderItem={({ item }) => (
            <View style={styles.itemCard}>
              <View style={styles.itemHeader}>
                <Text style={styles.itemName}>{item.name}</Text>
                <View style={styles.codeBadge}>
                  <Text style={styles.codeText}>{item.code}</Text>
                </View>
              </View>
              {item.description ? (
                <Text style={styles.itemDesc}>{item.description}</Text>
              ) : null}
            </View>
          )}
        />
      ) : activeSection === "TERRITORIES" ? (
        <FlatList
          data={allTerritories}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
          }
          renderItem={({ item }) => (
            <View style={styles.itemCard}>
              <View style={styles.itemHeader}>
                <Text style={styles.itemName}>{item.name}</Text>
                <View style={[styles.codeBadge, { backgroundColor: colors.lightPrimary }]}>
                  <Text style={[styles.codeText, { color: colors.primary }]}>{item.code}</Text>
                </View>
              </View>
              <Text style={styles.itemDesc}>Headquarters: {item.headquarters}</Text>
              {item.areas && item.areas.length > 0 && (
                <Text style={styles.subMeta}>
                  {item.areas.length} mapped areas ({item.areas.map((a) => a.name).join(", ")})
                </Text>
              )}
            </View>
          )}
        />
      ) : activeSection === "CATEGORIES" ? (
        <FlatList
          data={customerCategories}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
          }
          renderItem={({ item }) => (
            <View style={styles.itemCard}>
              <View style={styles.itemHeader}>
                <Text style={styles.itemName}>{item.name}</Text>
                <View style={styles.codeBadge}>
                  <Text style={styles.codeText}>Tier {item.code}</Text>
                </View>
              </View>
              {item.description ? (
                <Text style={styles.itemDesc}>{item.description}</Text>
              ) : null}
            </View>
          )}
        />
      ) : (
        /* GEOGRAPHY */
        <FlatList
          data={states}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
          }
          renderItem={({ item }) => (
            <View style={styles.itemCard}>
              <View style={styles.itemHeader}>
                <Text style={styles.itemName}>{item.name}</Text>
                <View style={styles.codeBadge}>
                  <Text style={styles.codeText}>{item.code}</Text>
                </View>
              </View>
            </View>
          )}
        />
      )}

      {/* Add Master Item Modal */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Add Specialization</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Code (e.g. ONCOLOGY)"
              placeholderTextColor={colors.textSecondary}
              autoCapitalize="characters"
              value={newCode}
              onChangeText={setNewCode}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Display Name (e.g. Oncology)"
              placeholderTextColor={colors.textSecondary}
              value={newName}
              onChangeText={setNewName}
            />
            <TextInput
              style={[styles.modalInput, { height: 60 }]}
              placeholder="Description (optional)"
              placeholderTextColor={colors.textSecondary}
              multiline
              value={newDesc}
              onChangeText={setNewDesc}
            />

            <View style={styles.modalButtonRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSaveBtn}
                onPress={handleCreateMasterItem}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.modalSaveText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Territory Modal */}
      <Modal visible={territoryModalVisible} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Add Territory</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Territory Name (e.g. Mumbai South)"
              placeholderTextColor={colors.textSecondary}
              value={tName}
              onChangeText={setTName}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Code (e.g. MUM_S_01)"
              placeholderTextColor={colors.textSecondary}
              autoCapitalize="characters"
              value={tCode}
              onChangeText={setTCode}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Headquarters City (e.g. Mumbai)"
              placeholderTextColor={colors.textSecondary}
              value={tHq}
              onChangeText={setTHq}
            />

            <View style={styles.modalButtonRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setTerritoryModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSaveBtn}
                onPress={handleCreateTerritory}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.modalSaveText}>Create Territory</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
    backgroundColor: colors.surface,
  },
  title: {
    ...typography.title,
    fontSize: 20,
    color: colors.navy,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
  },
  addButtonText: {
    ...typography.button,
    color: "#fff",
    fontSize: 12,
  },
  segmentContainer: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  segTab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
  },
  segTabActive: {
    backgroundColor: colors.lightPrimary,
  },
  segText: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  segTextActive: {
    color: colors.primary,
    fontWeight: "700",
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: spacing.xl * 2,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  itemCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  itemHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  itemName: {
    ...typography.subheading,
    fontSize: 14,
    color: colors.navy,
  },
  codeBadge: {
    backgroundColor: colors.background,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  codeText: {
    ...typography.caption,
    fontWeight: "600",
    color: colors.navy,
    fontSize: 11,
  },
  itemDesc: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 4,
  },
  subMeta: {
    ...typography.caption,
    color: colors.grey,
    marginTop: 4,
    fontSize: 11,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
  },
  modalBox: {
    width: "100%",
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.lg,
  },
  modalTitle: {
    ...typography.title,
    fontSize: 18,
    color: colors.navy,
    marginBottom: spacing.md,
  },
  modalInput: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 14,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  modalButtonRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  modalCancelBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  modalCancelText: {
    ...typography.button,
    color: colors.textSecondary,
  },
  modalSaveBtn: {
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  modalSaveText: {
    ...typography.button,
    color: "#fff",
  },
});
