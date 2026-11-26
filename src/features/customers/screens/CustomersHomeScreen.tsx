import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Linking,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
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
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../../navigation/types";
import { ROUTES } from "../../../navigation/routes";
import { colors, radii, shadows, spacing, typography } from "../../../theme";
import { ScreenHeader } from "../../../shared/components/ScreenHeader";

type TabType = "DOCTORS" | "CHEMISTS" | "HOSPITALS" | "STOCKISTS" | "NEARBY";

export function CustomersHomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
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
        const data = await customersApi.getNearbyCustomers({
          latitude: 19.076,
          longitude: 72.8777,
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

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

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
          onPress={() =>
            navigation.navigate(ROUTES.CustomerDetail, {
              customerType: "DOCTOR",
              customerId: doc.id,
              customerName: doc.full_name,
            })
          }
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
        subheading: `Contact: ${chm.contact_person || "Pharmacist"}`,
        badgeLabel: "Pharmacy",
        address: chm.address,
        phone: chm.phone,
      };
      return (
        <CustomerCard
          key={`chm-${chm.id}`}
          data={cardData}
          onPress={() =>
            navigation.navigate(ROUTES.CustomerDetail, {
              customerType: "CHEMIST",
              customerId: chm.id,
              customerName: chm.shop_name,
            })
          }
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
          onPress={() =>
            navigation.navigate(ROUTES.CustomerDetail, {
              customerType: "HOSPITAL",
              customerId: hosp.id,
              customerName: hosp.name,
            })
          }
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
          key={`stk-${st.id}`}
          data={cardData}
          onPress={() =>
            navigation.navigate(ROUTES.CustomerDetail, {
              customerType: "STOCKIST",
              customerId: st.id,
              customerName: st.agency_name,
            })
          }
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
        onPress={() =>
          navigation.navigate(ROUTES.CustomerDetail, {
            customerType: nb.customer_type as any,
            customerId: nb.id,
            customerName: nb.name,
          })
        }
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
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Top App Header with Short Title to prevent truncation */}
      <ScreenHeader
        title="Customers"
        subtitle="Doctors, Chemists & Stockists"
        variant="navy"
        onBack={navigation?.canGoBack && navigation.canGoBack() ? () => navigation.goBack() : undefined}
        rightElement={
          <TouchableOpacity
            style={styles.addButton}
            onPress={() =>
              navigation.navigate(ROUTES.CustomerForm, {
                customerType: "DOCTOR",
              })
            }
            activeOpacity={0.8}
            accessibilityLabel="Add Doctor"
          >
            <Feather name="plus" size={14} color={colors.surface} />
            <Text style={styles.addButtonText}>Add Doctor</Text>
          </TouchableOpacity>
        }
      />

      {/* Category Tabs */}
      <View style={styles.tabsWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsScrollContent}
        >
          {(
            [
              { id: "DOCTORS" as const, label: "Doctors", icon: "user" as const },
              { id: "CHEMISTS" as const, label: "Chemists", icon: "shopping-bag" as const },
              { id: "HOSPITALS" as const, label: "Hospitals", icon: "plus-square" as const },
              { id: "STOCKISTS" as const, label: "Stockists", icon: "package" as const },
              { id: "NEARBY" as const, label: "Nearby GPS", icon: "map-pin" as const },
            ]
          ).map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                style={[styles.tabButton, isActive && styles.tabButtonActive]}
                onPress={() => setActiveTab(tab.id)}
                activeOpacity={0.8}
              >
                <Feather
                  name={tab.icon}
                  size={14}
                  color={isActive ? colors.brandBlue : colors.textMuted}
                />
                <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Search & Territory Filter (for non-nearby tabs) */}
      {activeTab !== "NEARBY" && (
        <View style={styles.filterSection}>
          <View style={styles.searchBar}>
            <Feather name="search" size={16} color={colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder={`Search ${activeTab.toLowerCase()} by name, phone...`}
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

          {/* Territory Pills */}
          {territories.length > 0 && (
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={[{ id: 0, name: "All Territories" }, ...territories]}
              keyExtractor={(t, idx) => `terr-${t.id}-${idx}`}
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
                    activeOpacity={0.75}
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
          <ActivityIndicator size="large" color={colors.navy} />
          <Text style={styles.loadingText}>Fetching verified directory...</Text>
        </View>
      ) : (
        <FlatList
          data={getActiveList()}
          keyExtractor={(item: any) => `${activeTab}-${item.id}`}
          renderItem={({ item }) => renderCardItem(item)}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={colors.navy}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Feather name="folder" size={32} color={colors.brandBlue} />
              </View>
              <Text style={styles.emptyTitle}>No records found</Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery
                  ? "Try adjusting your search keywords."
                  : `No ${activeTab.toLowerCase()} registered in this territory.`}
              </Text>
              {activeTab === "DOCTORS" && (
                <TouchableOpacity
                  style={styles.addDoctorEmptyBtn}
                  onPress={() =>
                    navigation.navigate(ROUTES.CustomerForm, {
                      customerType: "DOCTOR",
                    })
                  }
                  activeOpacity={0.8}
                >
                  <Feather name="user-plus" size={15} color={colors.surface} />
                  <Text style={styles.addDoctorEmptyText}>Add First Doctor</Text>
                </TouchableOpacity>
              )}
            </View>
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
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radii.full,
  },
  addButtonText: {
    color: colors.surface,
    fontSize: 12,
    fontWeight: "700",
  },
  tabsWrap: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: 8,
  },
  tabsScrollContent: {
    paddingHorizontal: spacing.md,
    gap: 8,
  },
  tabButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radii.lg,
    backgroundColor: colors.background,
  },
  tabButtonActive: {
    backgroundColor: colors.bluePastel,
  },
  tabText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textMuted,
  },
  tabTextActive: {
    color: colors.brandBlue,
    fontWeight: "700",
  },
  filterSection: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.inputBackground,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    height: 44,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.textInk,
  },
  territoryList: {
    marginTop: 2,
  },
  territoryContent: {
    gap: 8,
  },
  territoryPill: {
    backgroundColor: colors.background,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  territoryPillActive: {
    backgroundColor: colors.navy,
    borderColor: colors.navy,
  },
  territoryPillText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textMuted,
  },
  territoryPillTextActive: {
    color: colors.surface,
    fontWeight: "700",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: colors.textMuted,
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: 40,
  },
  emptyContainer: {
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
  addDoctorEmptyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: spacing.md,
    backgroundColor: colors.navy,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: radii.lg,
  },
  addDoctorEmptyText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.surface,
  },
});
