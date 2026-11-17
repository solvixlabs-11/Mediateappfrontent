import React from "react";
import { FlatList, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { FontAwesome5, Ionicons } from "@expo/vector-icons";
import { DoctorDto } from "../../customers/api/customersApi";

interface DoctorSearchModalProps {
  visible: boolean;
  doctors: DoctorDto[];
  searchQuery: string;
  onSearchChange: (text: string) => void;
  onSelect: (doctor: DoctorDto) => void;
  onClose: () => void;
}

export function DoctorSearchModal({
  visible,
  doctors,
  searchQuery,
  onSearchChange,
  onSelect,
  onClose,
}: DoctorSearchModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.pickerCard}>
          <View style={styles.pickerHeader}>
            <Text style={styles.pickerTitle}>Select Doctor</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#64748B" />
            </TouchableOpacity>
          </View>

          <View style={styles.searchBar}>
            <Ionicons name="search" size={18} color="#94A3B8" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by doctor name..."
              value={searchQuery}
              onChangeText={onSearchChange}
            />
          </View>

          <FlatList
            data={doctors}
            keyExtractor={(item) => item.id.toString()}
            style={{ maxHeight: 360 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.itemRow}
                onPress={() => onSelect(item)}
              >
                <View style={styles.avatarMini}>
                  <FontAwesome5 name="user-md" size={16} color="#1B64DA" />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.itemName}>DR. {item.full_name.toUpperCase()}</Text>
                  <Text style={styles.itemSub}>
                    {item.specialization || "GENERAL"} • TIER {item.category || "A"}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  pickerCard: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    elevation: 8,
  },
  pickerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  pickerTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1E293B",
  },
  searchBar: {
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
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  avatarMini: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
  },
  itemName: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1E293B",
  },
  itemSub: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2,
  },
});

