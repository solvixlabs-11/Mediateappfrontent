import React from "react";
import { FlatList, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { FontAwesome5, Ionicons } from "@expo/vector-icons";

export interface CompanionItem {
  id: number;
  name: string;
  role: string;
  hq: string;
}

interface CompanionSearchModalProps {
  visible: boolean;
  companions: CompanionItem[];
  searchQuery: string;
  onSearchChange: (text: string) => void;
  onSelect: (companion: CompanionItem) => void;
  onClose: () => void;
}

export function CompanionSearchModal({
  visible,
  companions,
  searchQuery,
  onSearchChange,
  onSelect,
  onClose,
}: CompanionSearchModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.pickerCard}>
          <View style={styles.pickerHeader}>
            <Text style={styles.pickerTitle}>Working With (Companion)</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#64748B" />
            </TouchableOpacity>
          </View>

          <View style={styles.searchBar}>
            <Ionicons name="search" size={18} color="#94A3B8" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search colleague or manager..."
              value={searchQuery}
              onChangeText={onSearchChange}
            />
          </View>

          <FlatList
            data={companions}
            keyExtractor={(item) => item.id.toString()}
            style={{ maxHeight: 340 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.itemRow}
                onPress={() => onSelect(item)}
              >
                <View style={styles.avatarMini}>
                  <FontAwesome5 name="user-tie" size={16} color="#1B64DA" />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemSub}>
                    {item.role} • {item.hq}
                  </Text>
                </View>
                <Ionicons name="add-circle" size={22} color="#1B64DA" />
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

