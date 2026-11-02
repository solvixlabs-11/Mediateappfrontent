import React, { useState } from "react";
import {
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface ChangeTerritoryModalProps {
  visible: boolean;
  onClose: () => void;
  currentTerritory: string;
  onSelectTerritory: (territory: string) => void;
}

const DEFAULT_TERRITORIES = [
  "ALL INDIA P",
  "PUNE CENTRAL",
  "PUNE EAST",
  "MUMBAI SOUTH",
  "MUMBAI SUBURBAN",
  "NAGPUR METRO",
  "DELHI NCR",
  "BANGALORE URBAN",
  "HYDERABAD CENTRAL",
  "AHMEDABAD WEST",
  "KOLKATA METRO",
  "CHENNAI CENTRAL",
];

export function ChangeTerritoryModal({
  visible,
  onClose,
  currentTerritory,
  onSelectTerritory,
}: ChangeTerritoryModalProps) {
  const [search, setSearch] = useState("");

  const filtered = DEFAULT_TERRITORIES.filter((t) =>
    t.toLowerCase().includes(search.toLowerCase().trim())
  );

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <Ionicons name="location-sharp" size={20} color="#DC2626" />
              <Text style={styles.title}>Select Operational Territory</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={22} color="#64748B" />
            </TouchableOpacity>
          </View>

          <View style={styles.searchBox}>
            <Ionicons name="search" size={18} color="#94A3B8" />
            <TextInput
              style={styles.input}
              placeholder="Search territory or HQ..."
              placeholderTextColor="#94A3B8"
              value={search}
              onChangeText={setSearch}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch("")}>
                <Ionicons name="close-circle" size={16} color="#94A3B8" />
              </TouchableOpacity>
            )}
          </View>

          <FlatList
            data={filtered}
            keyExtractor={(item) => item}
            style={styles.list}
            renderItem={({ item }) => {
              const isSelected = item === currentTerritory;
              return (
                <TouchableOpacity
                  style={[styles.itemRow, isSelected && styles.itemRowActive]}
                  onPress={() => {
                    onSelectTerritory(item);
                    onClose();
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.itemText, isSelected && styles.itemTextActive]}>
                    {item}
                  </Text>
                  {isSelected && (
                    <Ionicons name="checkmark-circle" size={20} color="#DC2626" />
                  )}
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  dialog: {
    width: "100%",
    maxWidth: 340,
    maxHeight: 460,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 18,
    elevation: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  title: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1E293B",
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 10,
    gap: 8,
  },
  input: {
    flex: 1,
    fontSize: 13,
    color: "#1E293B",
    padding: 0,
  },
  list: {
    maxHeight: 300,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  itemRowActive: {
    backgroundColor: "#FEF2F2",
    borderRadius: 8,
  },
  itemText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#334155",
  },
  itemTextActive: {
    color: "#DC2626",
    fontWeight: "700",
  },
});
