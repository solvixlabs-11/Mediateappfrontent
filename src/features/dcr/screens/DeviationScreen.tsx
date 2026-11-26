import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { territoriesApi, TerritoryDto } from "../../territories/api/territoriesApi";
import { mastersApi, CityDto, AreaDto } from "../../masters/api/mastersApi";
import { ScreenHeader } from "../../../shared/components/ScreenHeader";

export function DeviationScreen() {
  const navigation = useNavigation();

  // Date
  const [date, setDate] = useState<string>(
    new Date()
      .toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" })
      .replace(/\//g, "-")
  );

  // Std. Route
  const [routes, setRoutes] = useState<TerritoryDto[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<TerritoryDto | null>(null);
  const [isRoutePickerOpen, setIsRoutePickerOpen] = useState(false);
  const [routeSearch, setRouteSearch] = useState("");

  // City
  const [cities, setCities] = useState<CityDto[]>([]);
  const [selectedCity, setSelectedCity] = useState<CityDto | null>(null);
  const [isCityPickerOpen, setIsCityPickerOpen] = useState(false);
  const [citySearch, setCitySearch] = useState("");

  // Area
  const [areas, setAreas] = useState<AreaDto[]>([]);
  const [selectedArea, setSelectedArea] = useState<AreaDto | null>(null);
  const [isAreaPickerOpen, setIsAreaPickerOpen] = useState(false);
  const [areaSearch, setAreaSearch] = useState("");

  const [isSaving, setIsSaving] = useState(false);

  // Load data from API
  useEffect(() => {
    // 1. Load Routes / Territories
    territoriesApi
      .listTerritories({ limit: 50 })
      .then((terr) => {
        setRoutes(terr || []);
      })
      .catch(() => {
        setRoutes([]);
      });

    // 2. Load Cities
    mastersApi
      .getCities()
      .then((cList) => {
        setCities(cList || []);
      })
      .catch(() => {
        setCities([]);
      });

    // 3. Load Areas
    mastersApi
      .getAreas()
      .then((aList) => {
        setAreas(aList || []);
      })
      .catch(() => {
        setAreas([]);
      });
  }, []);

  const handleSave = () => {
    if (!selectedRoute) {
      Alert.alert("Required", "Please select a Standard Route.");
      return;
    }
    if (!selectedCity) {
      Alert.alert("Required", "Please select a City.");
      return;
    }
    if (!selectedArea) {
      Alert.alert("Required", "Please select an Area.");
      return;
    }

    Alert.alert(
      "Deviation Logged",
      `Route deviation for ${selectedRoute.name} (${selectedCity.name} - ${selectedArea.name}) on ${date} recorded locally. Manager authorization endpoint pending backend activation.`,
      [{ text: "OK", onPress: () => navigation.goBack() }]
    );
  };

  const filteredRoutes = routes.filter((r) =>
    r.name.toLowerCase().includes(routeSearch.toLowerCase().trim())
  );

  const filteredCities = cities.filter((c) =>
    c.name.toLowerCase().includes(citySearch.toLowerCase().trim())
  );

  const filteredAreas = areas.filter((a) =>
    a.name.toLowerCase().includes(areaSearch.toLowerCase().trim())
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <StatusBar style="light" />

      {/* Header */}
      <ScreenHeader
        title="Deviation"
        subtitle="Beat & route deviation approval"
        variant="navy"
        onBack={() => navigation.goBack()}
      />

      {/* Form Content */}
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Date Field */}
        <View style={styles.fieldBlock}>
          <Text style={styles.fieldLabel}>Date</Text>
          <View style={styles.underlineInput}>
            <Text style={styles.valueText}>{date}</Text>
          </View>
        </View>

        {/* Std. Route Dropdown */}
        <View style={styles.fieldBlock}>
          <Text style={styles.fieldLabel}>Std. Route *</Text>
          <TouchableOpacity
            style={styles.underlineDropdown}
            onPress={() => setIsRoutePickerOpen(true)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.valueText,
                !selectedRoute && { color: "#94A3B8", fontWeight: "400" },
              ]}
            >
              {selectedRoute ? selectedRoute.name : ""}
            </Text>
            <Ionicons name="chevron-down" size={18} color="#64748B" />
          </TouchableOpacity>
        </View>

        {/* City Dropdown */}
        <View style={styles.fieldBlock}>
          <Text style={styles.fieldLabel}>City *</Text>
          <TouchableOpacity
            style={styles.underlineDropdown}
            onPress={() => setIsCityPickerOpen(true)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.valueText,
                !selectedCity && { color: "#94A3B8", fontWeight: "400" },
              ]}
            >
              {selectedCity ? selectedCity.name : ""}
            </Text>
            <Ionicons name="chevron-down" size={18} color="#64748B" />
          </TouchableOpacity>
        </View>

        {/* Area Dropdown */}
        <View style={styles.fieldBlock}>
          <Text style={styles.fieldLabel}>Area *</Text>
          <TouchableOpacity
            style={styles.underlineDropdown}
            onPress={() => setIsAreaPickerOpen(true)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.valueText,
                !selectedArea && { color: "#94A3B8", fontWeight: "400" },
              ]}
            >
              {selectedArea ? selectedArea.name : ""}
            </Text>
            <Ionicons name="chevron-down" size={18} color="#64748B" />
          </TouchableOpacity>
        </View>

        {/* SAVE Button */}
        <TouchableOpacity
          style={styles.saveBtn}
          onPress={handleSave}
          disabled={isSaving}
          activeOpacity={0.8}
        >
          {isSaving ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.saveBtnText}>SAVE</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* 1. Route Picker Modal */}
      <Modal visible={isRoutePickerOpen} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Std. Route</Text>
              <TouchableOpacity onPress={() => setIsRoutePickerOpen(false)}>
                <Ionicons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.searchBox}>
              <Ionicons name="search" size={18} color="#94A3B8" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search route..."
                value={routeSearch}
                onChangeText={setRouteSearch}
              />
            </View>

            <FlatList
              data={filteredRoutes}
              keyExtractor={(item) => item.id.toString()}
              style={{ maxHeight: 320 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.itemRow}
                  onPress={() => {
                    setSelectedRoute(item);
                    setIsRoutePickerOpen(false);
                  }}
                >
                  <Text style={styles.itemName}>{item.name}</Text>
                  {selectedRoute?.id === item.id && (
                    <Ionicons name="checkmark-circle" size={20} color="#1B64DA" />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* 2. City Picker Modal */}
      <Modal visible={isCityPickerOpen} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select City</Text>
              <TouchableOpacity onPress={() => setIsCityPickerOpen(false)}>
                <Ionicons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.searchBox}>
              <Ionicons name="search" size={18} color="#94A3B8" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search city..."
                value={citySearch}
                onChangeText={setCitySearch}
              />
            </View>

            <FlatList
              data={filteredCities}
              keyExtractor={(item) => item.id.toString()}
              style={{ maxHeight: 320 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.itemRow}
                  onPress={() => {
                    setSelectedCity(item);
                    setIsCityPickerOpen(false);
                  }}
                >
                  <Text style={styles.itemName}>{item.name}</Text>
                  {selectedCity?.id === item.id && (
                    <Ionicons name="checkmark-circle" size={20} color="#1B64DA" />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* 3. Area Picker Modal */}
      <Modal visible={isAreaPickerOpen} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Area</Text>
              <TouchableOpacity onPress={() => setIsAreaPickerOpen(false)}>
                <Ionicons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.searchBox}>
              <Ionicons name="search" size={18} color="#94A3B8" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search area..."
                value={areaSearch}
                onChangeText={setAreaSearch}
              />
            </View>

            <FlatList
              data={filteredAreas}
              keyExtractor={(item) => item.id.toString()}
              style={{ maxHeight: 320 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.itemRow}
                  onPress={() => {
                    setSelectedArea(item);
                    setIsAreaPickerOpen(false);
                  }}
                >
                  <Text style={styles.itemName}>{item.name}</Text>
                  {selectedArea?.id === item.id && (
                    <Ionicons name="checkmark-circle" size={20} color="#1B64DA" />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#1E293B",
  },
  header: {
    height: 56,
    backgroundColor: "#1E293B",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    gap: 16,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  content: {
    padding: 20,
    paddingTop: 24,
  },
  fieldBlock: {
    marginBottom: 24,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
    marginBottom: 6,
  },
  underlineInput: {
    borderBottomWidth: 1,
    borderBottomColor: "#CBD5E1",
    paddingVertical: 8,
  },
  underlineDropdown: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#CBD5E1",
    paddingVertical: 10,
    minHeight: 40,
  },
  valueText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1E293B",
    flex: 1,
  },
  saveBtn: {
    backgroundColor: "#E11D48",
    paddingVertical: 13,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    elevation: 2,
    shadowColor: "#E11D48",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  saveBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalCard: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1E293B",
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: "#1E293B",
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  itemName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E293B",
  },
});
