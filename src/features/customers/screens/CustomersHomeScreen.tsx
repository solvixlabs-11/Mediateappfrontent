import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Linking,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useMasterStore } from "../../masters/store";
import {
  ChemistDto,
  DoctorDto,
  HospitalDto,
  NearbyCustomerDto,
  StockistDto,
  customersApi,
} from "../api/customersApi";
import { CustomerCard, CustomerCardData } from "../components/CustomerCard";
import { AddDoctorModal } from "./AddDoctorModal";
import { DoctorDetailModal } from "./DoctorDetailModal";
import { colors, radii, spacing, typography } from "../../../shared/theme/tokens";

type TabType = "DOCTORS" | "CHEMISTS" | "HOSPITALS" | "STOCKISTS" | "NEARBY";

export function CustomersHomeScreen() {
  const { fetchMasters, territories } = useMasterStore();

  const [activeTab, setActiveTab] = useState<TabType>("DOCTORS");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTerritoryId, setSelectedTerritoryId] = useState<number | undefined>(undefined);

  // Data states
  const [doctors, setDoctors] = useState<DoctorDto[]>([]);
  const [chemists, setChemists] = useState<ChemistDto[]>([]);
  const [hospitals, setHospitals] = useState<HospitalDto[]>([]);
  const [stockists, setStockists] = useState<StockistDto[]>([]);
  const [nearby, setNearby] = useState<NearbyCustomerDto[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modals
  const [addDoctorVisible, setAddDoctorVisible] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorDto | null>(null);

  // Load masters on mount
  useEffect(() => {
    fetchMasters();
  }, [fetchMasters]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      if (activeTab === "DOCTORS") {
        const data = await customersApi.listDoctors({
          search: searchQuery || undefined,
          territory_id: selectedTerritoryId,
        });
        setDoctors(data);
      } else if (activeTab === "CHEMISTS") {
        const data = await customersApi.listChemists({
          search: searchQuery || undefined,
        });
        setChemists(data);
      } else if (activeTab === "HOSPITALS") {
        const data = await customersApi.listHospitals({
          search: searchQuery || undefined,
        });
        setHospitals(data);
      } else if (activeTab === "STOCKISTS") {
        const data = await customersApi.listStockists({
          search: searchQuery || undefined,
        });
        setStockists(data);
      } else if (activeTab === "NEARBY") {
        // Fetch nearby with user's position or HQ default
        const data = await customersApi.getNearbyCustomers({
          latitude: 19.05195,
          longitude: 72.82905,
          radius_meters: 5000,
        });
        setNearby(data);
      }
    } catch (err) {
      console.error("Failed to load customer list:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [activeTab, searchQuery, selectedTerritoryId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadData();
  };

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  // Convert tab items to unified card data
  const renderCardItem = (item: any) => {
    let cardData: CustomerCardData;

    if (activeTab === "DOCTORS") {
      const doc = item as DoctorDto;
      cardData = {
        id: doc.id,
        type: "DOCTOR",
        code: doc.code,
        name: doc.full_name,
        subheading: doc.qualification
          ? `${doc.qualification} • ${doc.specialization || "General"}`
          : doc.specialization || "General",
        badgeLabel: `Tier ${doc.category}`,
        address: doc.address || doc.clinic_name,
        phone: doc.phone,
      };
      return (
        <CustomerCard
          key={`doc-${doc.id}`}
          data={cardData}
          onPress={() => setSelectedDoctor(doc)}
          onCallPress={handleCall}
        />
      );
    }

    if (activeTab === "CHEMISTS") {
      const chm = item as ChemistDto;
      cardData = {
        id: chm.id,
        type: "CHEMIST",
        code: chm.code,
        name: chm.shop_name,
        subheading: chm.contact_person ? `Contact: ${chm.contact_person}` : "Pharmacy",
        badgeLabel: "Chemist",
        address: chm.address,
        phone: chm.phone,
      };
      return (
        <CustomerCard
          key={`chem-${chm.id}`}
          data={cardData}
          onCallPress={handleCall}
        />
      );
    }

    if (activeTab === "HOSPITALS") {
      const hosp = item as HospitalDto;
      cardData = {
        id: hosp.id,
        type: "HOSPITAL",
        code: hosp.code,
        name: hosp.name,
        subheading: hosp.bed_count ? `${hosp.bed_count} Beds • ${hosp.type}` : hosp.type,
        badgeLabel: hosp.type,
        address: hosp.address,
        phone: hosp.phone,
      };
      return (
        <CustomerCard
          key={`hosp-${hosp.id}`}
          data={cardData}
          onCallPress={handleCall}
        />
      );
    }

    if (activeTab === "STOCKISTS") {
      const st = item as StockistDto;
      cardData = {
        id: st.id,
        type: "STOCKIST",
        code: st.code,
        name: st.agency_name,
        subheading: `Credit: ${st.credit_days} days • ${st.contact_person || ""}`,
        badgeLabel: "Distributor",
        address: st.address,
        phone: st.phone,
      };
      return (
        <CustomerCard
          key={`st-${st.id}`}
          data={cardData}
          onCallPress={handleCall}
        />
      );
    }

    // NEARBY
    const nb = item as NearbyCustomerDto;
    cardData = {
      id: nb.id,
      type: nb.customer_type,
      name: nb.name,
      subheading: nb.category_or_type,
      address: nb.address,
      phone: nb.phone,
      distanceMeters: nb.distance_meters,
      inGeofence: nb.in_geofence,
    };
    return (
      <CustomerCard
        key={`nearby-${nb.customer_type}-${nb.id}`}
        data={cardData}
        onCallPress={handleCall}
      />
    );
  };

  const getActiveList = () => {
    switch (activeTab) {
      case "DOCTORS":
        return doctors;
      case "CHEMISTS":
        return chemists;
      case "HOSPITALS":
        return hospitals;
      case "STOCKISTS":
        return stockists;
      case "NEARBY":
        return nearby;
      default:
        return [];
    }
  };

  return (
    <View style={styles.container}>
      {/* Top App Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Customers Directory</Text>
          <Text style={styles.subtitle}>
            Doctors, Chemists, Hospitals & Stockists
          </Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setAddDoctorVisible(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.addButtonText}>Add Doctor</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {(
          [
            { id: "DOCTORS", label: "Doctors", icon: "person" },
            { id: "CHEMISTS", label: "Chemists", icon: "flask" },
            { id: "HOSPITALS", label: "Hospitals", icon: "business" },
            { id: "STOCKISTS", label: "Stockists", icon: "cube" },
            { id: "NEARBY", label: "Nearby GPS", icon: "navigate" },
          ] as const
        ).map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tabButton, isActive && styles.tabButtonActive]}
              onPress={() => setActiveTab(tab.id)}
            >
              <Ionicons
                name={tab.icon as any}
                size={14}
                color={isActive ? colors.primary : colors.textSecondary}
              />
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Search & Territory Filter (for non-nearby tabs) */}
      {activeTab !== "NEARBY" && (
        <View style={styles.filterSection}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={16} color={colors.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder={`Search ${activeTab.toLowerCase()} by name, phone...`}
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Ionicons name="close-circle" size={16} color={colors.grey} />
              </TouchableOpacity>
            )}
          </View>

          {/* Territory Pills */}
          {territories.length > 0 && (
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={[{ id: 0, name: "All Territories" }, ...territories]}
              keyExtractor={(t) => String(t.id)}
              style={styles.territoryList}
              contentContainerStyle={styles.territoryContent}
              renderItem={({ item }) => {
                const isSelected =
                  item.id === 0
                    ? selectedTerritoryId === undefined
                    : selectedTerritoryId === item.id;
                return (
                  <TouchableOpacity
                    style={[
                      styles.territoryPill,
                      isSelected && styles.territoryPillActive,
                    ]}
                    onPress={() =>
                      setSelectedTerritoryId(item.id === 0 ? undefined : item.id)
                    }
                  >
                    <Text
                      style={[
                        styles.territoryPillText,
                        isSelected && styles.territoryPillTextActive,
                      ]}
                    >
                      {item.name}
                    </Text>
                  </TouchableOpacity>
                );
              }}
            />
          )}
        </View>
      )}

      {/* List */}
      {isLoading && !isRefreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Fetching verified directory...</Text>
        </View>
      ) : (
        <FlatList
          data={getActiveList()}
          keyExtractor={(item: any) => `${activeTab}-${item.id}`}
          renderItem={({ item }) => renderCardItem(item)}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="folder-open-outline" size={48} color={colors.grey} />
              <Text style={styles.emptyTitle}>No records found</Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery
                  ? "Try adjusting your search keywords."
                  : `No ${activeTab.toLowerCase()} registered in this territory.`}
              </Text>
              {activeTab === "DOCTORS" && (
                <TouchableOpacity
                  style={styles.addDoctorEmptyBtn}
                  onPress={() => setAddDoctorVisible(true)}
                >
                  <Ionicons name="person-add" size={16} color={colors.primary} />
                  <Text style={styles.addDoctorEmptyText}>Add First Doctor</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}

      {/* Add Doctor Modal */}
      <AddDoctorModal
        visible={addDoctorVisible}
        onClose={() => setAddDoctorVisible(false)}
        onDoctorCreated={(doc) => {
          setDoctors((prev) => [doc, ...prev]);
        }}
      />

      {/* Doctor Detail Modal */}
      <DoctorDetailModal
        doctor={selectedDoctor}
        visible={selectedDoctor !== null}
        onClose={() => setSelectedDoctor(null)}
      />
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
    paddingBottom: spacing.sm,
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
  tabsContainer: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tabButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
  },
  tabButtonActive: {
    backgroundColor: colors.lightPrimary,
  },
  tabText: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.primary,
    fontWeight: "700",
  },
  filterSection: {
    backgroundColor: colors.surface,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.background,
    borderRadius: radii.md,
    marginHorizontal: spacing.lg,
    marginTop: spacing.xs,
    paddingHorizontal: spacing.md,
    height: 38,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    marginLeft: spacing.sm,
    ...typography.body,
    fontSize: 13,
    color: colors.text,
  },
  territoryList: {
    marginTop: spacing.xs + 2,
  },
  territoryContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.xs,
  },
  territoryPill: {
    backgroundColor: colors.background,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  territoryPillActive: {
    backgroundColor: colors.navy,
    borderColor: colors.navy,
  },
  territoryPillText: {
    ...typography.caption,
    fontSize: 11,
    color: colors.textSecondary,
  },
  territoryPillTextActive: {
    color: "#fff",
    fontWeight: "600",
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: spacing.xl * 2,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: spacing.xl * 2,
  },
  emptyTitle: {
    ...typography.title,
    fontSize: 16,
    color: colors.navy,
    marginTop: spacing.md,
  },
  emptySubtitle: {
    ...typography.body,
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: spacing.xs,
    paddingHorizontal: spacing.xl,
  },
  addDoctorEmptyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.lightPrimary,
    borderRadius: radii.md,
  },
  addDoctorEmptyText: {
    ...typography.button,
    color: colors.primary,
    fontSize: 13,
  },
});
