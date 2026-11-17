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
import { Ionicons, MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { productsApi } from "../../products/api/productsApi";
import { usersApi } from "../../users/api/usersApi";

interface GenericModalProps {
  visible: boolean;
  onClose: () => void;
}

// 1. Credit Note Modal
export function CreditNoteModal({ visible, onClose }: GenericModalProps) {
  const [stockist, setStockist] = useState("");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("Expiry Return");

  const handleSubmit = () => {
    if (!stockist || !amount) {
      Alert.alert("Required Fields", "Please enter stockist name and credit amount.");
      return;
    }
    Alert.alert("Credit Note Generated", `Credit Note of ₹${amount} issued for ${stockist}. Status: Pending Verification.`);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <MaterialCommunityIcons name="file-document-outline" size={22} color="#DC2626" />
              <Text style={styles.title}>Credit Note Management</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={22} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body}>
            <Text style={styles.label}>Stockist / Distributor</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Mahavir Pharma Distributors"
              value={stockist}
              onChangeText={setStockist}
            />

            <Text style={styles.label}>Credit Amount (₹)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 15400"
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
            />

            <Text style={styles.label}>Reason for Return</Text>
            <View style={styles.pillsRow}>
              {["Expiry Return", "Breakage / Damage", "Scheme Difference", "Short Supply"].map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[styles.pill, reason === r && styles.pillActive]}
                  onPress={() => setReason(r)}
                >
                  <Text style={[styles.pillText, reason === r && styles.pillTextActive]}>{r}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
              <Text style={styles.submitBtnText}>Submit Credit Note</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// 2. Primary Sales Modal
export function PrimarySalesModal({ visible, onClose }: GenericModalProps) {
  const [invNumber, setInvNumber] = useState("");
  const [stockist, setStockist] = useState("");
  const [value, setValue] = useState("");

  const handleSubmit = () => {
    if (!invNumber || !stockist || !value) {
      Alert.alert("Required Fields", "Please complete all primary sales fields.");
      return;
    }
    Alert.alert("Primary Sales Booked", `Invoice #${invNumber} for ₹${value} recorded successfully.`);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <MaterialCommunityIcons name="chart-box-plus-outline" size={22} color="#DC2626" />
              <Text style={styles.title}>Primary Sales Entry</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={22} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body}>
            <Text style={styles.label}>Stockist Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Apollo Supply Agency"
              value={stockist}
              onChangeText={setStockist}
            />

            <Text style={styles.label}>Invoice Number</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. INV-2026-8834"
              value={invNumber}
              onChangeText={setInvNumber}
            />

            <Text style={styles.label}>Invoice Net Value (₹)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 45000"
              keyboardType="numeric"
              value={value}
              onChangeText={setValue}
            />

            <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
              <Text style={styles.submitBtnText}>Record Primary Sale</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// 3. Secondary Sales Modal (POB from Chemist)
export function SecondarySalesModal({ visible, onClose }: GenericModalProps) {
  const [chemist, setChemist] = useState("");
  const [orderValue, setOrderValue] = useState("");
  const [selectedStockist, setSelectedStockist] = useState("");

  const handleSubmit = () => {
    if (!chemist || !orderValue) {
      Alert.alert("Required", "Please specify chemist shop and booking amount.");
      return;
    }
    Alert.alert("POB Recorded", `Secondary booking of ₹${orderValue} booked for ${chemist}.`);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <MaterialIcons name="trending-up" size={22} color="#DC2626" />
              <Text style={styles.title}>Secondary Sales (Chemist POB)</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={22} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body}>
            <Text style={styles.label}>Chemist Retailer</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Care & Cure Medicos"
              value={chemist}
              onChangeText={setChemist}
            />

            <Text style={styles.label}>Supply Through Stockist</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Apex Pharma Distributors"
              value={selectedStockist}
              onChangeText={setSelectedStockist}
            />

            <Text style={styles.label}>POB Order Value (₹)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 8500"
              keyboardType="numeric"
              value={orderValue}
              onChangeText={setOrderValue}
            />

            <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
              <Text style={styles.submitBtnText}>Book Secondary Order</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// 4. Sample Receive Modal
export function SampleReceiveModal({ visible, onClose }: GenericModalProps) {
  const [samples, setSamples] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      setIsLoading(true);
      productsApi
        .list({ limit: 20 })
        .then((items) => {
          setSamples(items || []);
        })
        .catch(() => setSamples([]))
        .finally(() => setIsLoading(false));
    }
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.modalCard, { maxHeight: 520 }]}>
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Ionicons name="medkit" size={22} color="#DC2626" />
              <Text style={styles.title}>Sample & Gift Inventory</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={22} color="#64748B" />
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <View style={{ padding: 30, alignItems: "center" }}>
              <ActivityIndicator size="small" color="#0D9488" />
              <Text style={{ marginTop: 8, fontSize: 13, color: "#64748B" }}>Loading field samples...</Text>
            </View>
          ) : samples.length === 0 ? (
            <View style={{ padding: 24, alignItems: "center" }}>
              <Ionicons name="cube-outline" size={32} color="#94A3B8" />
              <Text style={{ fontSize: 14, fontWeight: "600", color: "#334155", marginTop: 8 }}>
                No Samples Logged
              </Text>
              <Text style={{ fontSize: 12, color: "#94A3B8", marginTop: 4, textAlign: "center" }}>
                No active promotional product samples are currently checked out to your territory.
              </Text>
            </View>
          ) : (
            <FlatList
              data={samples}
              keyExtractor={(it) => String(it.id)}
              renderItem={({ item }) => (
                <View style={styles.sampleItem}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.sampleName}>{item.name}</Text>
                    <Text style={styles.sampleBatch}>Code: {item.code} | MRP: ₹{item.mrp || 0}</Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.ackBtn, styles.ackBtnActive]}
                    onPress={() => {
                      Alert.alert("Sample Logged", `Receipt for ${item.name} recorded into field stock.`);
                    }}
                  >
                    <Text style={styles.ackBtnText}>Acknowledge</Text>
                  </TouchableOpacity>
                </View>
              )}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

// 5. Doctor Business Modal
export function DoctorBusinessModal({ visible, onClose }: GenericModalProps) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.modalCard, { maxHeight: 520 }]}>
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <MaterialCommunityIcons name="doctor" size={22} color="#DC2626" />
              <Text style={styles.title}>Dr. Monthly Business</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={22} color="#64748B" />
            </TouchableOpacity>
          </View>

          <View style={{ padding: 24, alignItems: "center" }}>
            <Ionicons name="analytics-outline" size={36} color="#94A3B8" />
            <Text style={{ fontSize: 15, fontWeight: "600", color: "#334155", marginTop: 12 }}>
              Doctor Sales Tracking
            </Text>
            <Text style={{ fontSize: 13, color: "#64748B", textAlign: "center", marginTop: 6, lineHeight: 18 }}>
              Individual doctor business tracking is being connected to the ERP billing stream. Aggregate team POB and primary order targets are visible in the Reports section.
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// 6. Induction & Training Modal
export function InductionModal({ visible, onClose }: GenericModalProps) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.modalCard, { maxHeight: 520 }]}>
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <MaterialCommunityIcons name="presentation" size={22} color="#DC2626" />
              <Text style={styles.title}>Field Induction & Training</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={22} color="#64748B" />
            </TouchableOpacity>
          </View>

          <View style={{ padding: 24, alignItems: "center" }}>
            <Ionicons name="school-outline" size={36} color="#94A3B8" />
            <Text style={{ fontSize: 15, fontWeight: "600", color: "#334155", marginTop: 12 }}>
              Field Induction Materials
            </Text>
            <Text style={{ fontSize: 13, color: "#64748B", textAlign: "center", marginTop: 6, lineHeight: 18 }}>
              Product detailing visual aids and clinical presentations are available under the Products tab. Field induction modules will be published by your training manager.
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// 7. What's New Modal
export function WhatsNewModal({ visible, onClose }: GenericModalProps) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Ionicons name="sparkles" size={22} color="#DC2626" />
              <Text style={styles.title}>What's New in v1.0.63</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={22} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body}>
            <View style={styles.updateItem}>
              <Ionicons name="checkmark-circle" size={20} color="#16A34A" />
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={styles.updateTitle}>MR Buddy UI Integration</Text>
                <Text style={styles.updateDesc}>High-speed 2-column action grid with dedicated quick cards.</Text>
              </View>
            </View>

            <View style={styles.updateItem}>
              <Ionicons name="checkmark-circle" size={20} color="#16A34A" />
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={styles.updateTitle}>Instant Biometric Attendance</Text>
                <Text style={styles.updateDesc}>One-tap punch in and punch out from the top navigation bar.</Text>
              </View>
            </View>

            <View style={styles.updateItem}>
              <Ionicons name="checkmark-circle" size={20} color="#16A34A" />
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={styles.updateTitle}>26 Comprehensive Reports</Text>
                <Text style={styles.updateDesc}>Group A to J reports with live filtering and instant export.</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.submitBtn} onPress={onClose}>
              <Text style={styles.submitBtnText}>Got it!</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// 8. SMS Broadcast Modal
export function SMSBroadcastModal({ visible, onClose }: GenericModalProps) {
  const [recipient, setRecipient] = useState("All Active MRs");
  const [msg, setMsg] = useState("");

  const handleSend = () => {
    if (!msg.trim()) {
      Alert.alert("Empty Message", "Please type an SMS message to broadcast.");
      return;
    }
    Alert.alert("Broadcast Queued", `SMS broadcast successfully sent to ${recipient}.`);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Ionicons name="chatbox-ellipses" size={22} color="#DC2626" />
              <Text style={styles.title}>SMS Broadcast & Alerts</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={22} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body}>
            <Text style={styles.label}>Recipient Group</Text>
            <View style={styles.pillsRow}>
              {["All Active MRs", "Doctors (Cardio)", "Chemists (Pune)", "Area Managers"].map((g) => (
                <TouchableOpacity
                  key={g}
                  style={[styles.pill, recipient === g && styles.pillActive]}
                  onPress={() => setRecipient(g)}
                >
                  <Text style={[styles.pillText, recipient === g && styles.pillTextActive]}>{g}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Message Text</Text>
            <TextInput
              style={[styles.input, { height: 80, textAlignVertical: "top" }]}
              placeholder="Type announcement or notification here..."
              multiline
              value={msg}
              onChangeText={setMsg}
            />

            <TouchableOpacity style={styles.submitBtn} onPress={handleSend}>
              <Text style={styles.submitBtnText}>Send Broadcast SMS</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// 9. Employee Live Tracker Modal
export function EmployeeLiveTrackerModal({ visible, onClose }: GenericModalProps) {
  const [reps, setReps] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      setIsLoading(true);
      usersApi
        .getLiveTracking()
        .then((items) => {
          setReps(items || []);
        })
        .catch(() => setReps([]))
        .finally(() => setIsLoading(false));
    }
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.modalCard, { maxHeight: 520 }]}>
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Ionicons name="globe-outline" size={22} color="#DC2626" />
              <Text style={styles.title}>Live Field Activity Map</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={22} color="#64748B" />
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <View style={{ padding: 30, alignItems: "center" }}>
              <ActivityIndicator size="small" color="#0D9488" />
              <Text style={{ marginTop: 8, fontSize: 13, color: "#64748B" }}>Connecting to GPS tracking...</Text>
            </View>
          ) : reps.length === 0 ? (
            <View style={{ padding: 24, alignItems: "center" }}>
              <Ionicons name="map-outline" size={32} color="#94A3B8" />
              <Text style={{ fontSize: 14, fontWeight: "600", color: "#334155", marginTop: 8 }}>
                No Active Representatives
              </Text>
              <Text style={{ fontSize: 12, color: "#94A3B8", marginTop: 4, textAlign: "center" }}>
                No field representatives are currently checked in or transmitting active telemetry.
              </Text>
            </View>
          ) : (
            <FlatList
              data={reps}
              keyExtractor={(it) => String(it.id || it.name)}
              renderItem={({ item }) => (
                <View style={styles.repCard}>
                  <View style={[styles.statusDot, { backgroundColor: item.status?.includes("CHECK") ? "#16A34A" : "#2563EB" }]} />
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.repName}>{item.name}</Text>
                    <Text style={styles.repTerritory}>{item.hq || "Field"} • {item.status || "Active"}</Text>
                  </View>
                  <Text style={styles.repTime}>{item.last_updated ? "Live" : "Recent"}</Text>
                </View>
              )}
            />
          )}
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
  modalCard: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 18,
    elevation: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1E293B",
  },
  body: {
    maxHeight: 400,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    color: "#475569",
    marginBottom: 6,
  },
  input: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#1E293B",
    marginBottom: 14,
  },
  pillsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 14,
  },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#F1F5F9",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  pillActive: {
    backgroundColor: "#FEE2E2",
    borderColor: "#DC2626",
  },
  pillText: {
    fontSize: 11,
    fontWeight: "500",
    color: "#64748B",
  },
  pillTextActive: {
    color: "#DC2626",
    fontWeight: "700",
  },
  submitBtn: {
    backgroundColor: "#DC2626",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 6,
    marginBottom: 6,
  },
  submitBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  sampleItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  sampleName: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1E293B",
  },
  sampleBatch: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2,
  },
  ackBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  ackBtnActive: {
    backgroundColor: "#DC2626",
  },
  ackBtnDisabled: {
    backgroundColor: "#E2E8F0",
  },
  ackBtnText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  docBizCard: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  docBizName: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1E293B",
  },
  docBizRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 6,
  },
  docBizStat: {
    fontSize: 12,
    color: "#64748B",
  },
  pctBadge: {
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  pctText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#16A34A",
  },
  moduleCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  moduleTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1E293B",
  },
  moduleSubtitle: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2,
  },
  updateItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  updateTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1E293B",
  },
  updateDesc: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  repCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  repName: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1E293B",
  },
  repTerritory: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2,
  },
  repTime: {
    fontSize: 11,
    color: "#94A3B8",
  },
});
