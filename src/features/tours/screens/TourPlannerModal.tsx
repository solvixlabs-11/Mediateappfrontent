import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { TourProgramDto, toursApi } from "../api/toursApi";
import { colors, radii, spacing } from "../../../shared/theme/tokens";

interface TourPlannerModalProps {
  visible: boolean;
  onClose: () => void;
}

export const TourPlannerModal: React.FC<TourPlannerModalProps> = ({ visible, onClose }) => {
  const [tours, setTours] = useState<TourProgramDto[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);

  // Form fields
  const [title, setTitle] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [routeDetails, setRouteDetails] = useState<string>("");
  const [objectives, setObjectives] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const loadTours = useCallback(async () => {
    try {
      const data = await toursApi.list();
      setTours(data);
    } catch {
      Alert.alert("Error", "Could not load tour programs.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (visible) {
      loadTours();
    }
  }, [visible, loadTours]);

  const onRefresh = () => {
    setIsRefreshing(true);
    loadTours();
  };

  const handleCreateTour = async () => {
    if (!title.trim()) {
      Alert.alert("Title Required", "Please enter a tour title (e.g. 'South Mumbai Weekly Beat').");
      return;
    }
    if (!startDate.trim() || !endDate.trim()) {
      Alert.alert("Dates Required", "Please enter both start and end dates (YYYY-MM-DD).");
      return;
    }

    setIsSubmitting(true);
    try {
      await toursApi.create({
        title: title.trim(),
        start_date: startDate.trim(),
        end_date: endDate.trim(),
        route_details: routeDetails.trim() || undefined,
        objectives: objectives.trim() || undefined,
      });

      Alert.alert(
        "Tour Program Created",
        "Your monthly tour plan has been submitted for manager approval."
      );
      setTitle("");
      setStartDate("");
      setEndDate("");
      setRouteDetails("");
      setObjectives("");
      setIsCreateOpen(false);
      loadTours();
    } catch (err: any) {
      const msg = err?.response?.data?.detail || "Failed to create tour program.";
      Alert.alert("Submission Failed", msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "APPROVED":
        return { bg: "#D1FAE5", text: "#059669" };
      case "REJECTED":
        return { bg: "#FEE2E2", text: "#DC2626" };
      default:
        return { bg: "#FEF3C7", text: "#B45309" };
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Monthly Tour Program (TP)</Text>
              <Text style={styles.subtitle}>Plan field beats & outstation doctor itineraries</Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={24} color="#64748B" />
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Loading tour plans...</Text>
            </View>
          ) : (
            <ScrollView
              contentContainerStyle={styles.scrollList}
              refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
              showsVerticalScrollIndicator={false}
            >
              {tours.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Ionicons name="map-outline" size={48} color="#CBD5E1" />
                  <Text style={styles.emptyTitle}>No Tour Programs</Text>
                  <Text style={styles.emptySubtitle}>
                    Tap &quot;+ Plan New Tour Program&quot; below to propose your upcoming route beats.
                  </Text>
                </View>
              ) : (
                tours.map((item) => {
                  const badge = getStatusBadge(item.status);
                  return (
                    <View key={item.id} style={styles.tourCard}>
                      <View style={styles.tourHeader}>
                        <Text style={styles.tourTitle}>{item.title}</Text>
                        <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                          <Text style={[styles.badgeText, { color: badge.text }]}>
                            {item.status}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.datesRow}>
                        <Ionicons name="calendar-outline" size={14} color="#0D5C46" />
                        <Text style={styles.datesText}>
                          {item.start_date} &rarr; {item.end_date}
                        </Text>
                      </View>

                      {item.route_details ? (
                        <View style={styles.routeRow}>
                          <Ionicons name="trail-sign-outline" size={14} color="#64748B" />
                          <Text style={styles.routeText}>{item.route_details}</Text>
                        </View>
                      ) : null}

                      {item.objectives ? (
                        <Text style={styles.objectivesText} numberOfLines={2}>
                          🎯 {item.objectives}
                        </Text>
                      ) : null}

                      {item.rejection_reason ? (
                        <View style={styles.rejectionNotice}>
                          <Ionicons name="alert-circle" size={14} color="#DC2626" />
                          <Text style={styles.rejectionReasonText}>
                            Manager Feedback: {item.rejection_reason}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                  );
                })
              )}
            </ScrollView>
          )}

          {/* Bottom Action Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.createBtn}
              activeOpacity={0.85}
              onPress={() => setIsCreateOpen(true)}
            >
              <Ionicons name="add-circle" size={20} color="#FFFFFF" />
              <Text style={styles.createBtnText}>+ Plan New Tour Program</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Submodal to Create Tour */}
      <Modal visible={isCreateOpen} animationType="slide" transparent>
        <View style={styles.overlay}>
          <View style={styles.sheetContainer}>
            <View style={styles.header}>
              <View>
                <Text style={styles.title}>Submit Tour Program</Text>
                <Text style={styles.subtitle}>Enforces no tour overlap rules (BR-09)</Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsCreateOpen(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
              <Text style={styles.label}>Tour Title / Name *</Text>
              <TextInput
                style={styles.textInput}
                value={title}
                onChangeText={setTitle}
                placeholder="e.g. October Dadar-Bandra Fortnightly Beat"
                placeholderTextColor="#94A3B8"
              />

              <View style={styles.dateInputsRow}>
                <View style={styles.dateField}>
                  <Text style={styles.label}>Start Date (YYYY-MM-DD) *</Text>
                  <TextInput
                    style={styles.textInput}
                    value={startDate}
                    onChangeText={setStartDate}
                    placeholder="2026-10-05"
                    placeholderTextColor="#94A3B8"
                  />
                </View>
                <View style={styles.dateField}>
                  <Text style={styles.label}>End Date (YYYY-MM-DD) *</Text>
                  <TextInput
                    style={styles.textInput}
                    value={endDate}
                    onChangeText={setEndDate}
                    placeholder="2026-10-10"
                    placeholderTextColor="#94A3B8"
                  />
                </View>
              </View>

              <Text style={styles.label}>Target Routes / Territories</Text>
              <TextInput
                style={styles.textInput}
                value={routeDetails}
                onChangeText={setRouteDetails}
                placeholder="e.g. Dadar East, Parel Hospital belt, Lower Parel"
                placeholderTextColor="#94A3B8"
              />

              <Text style={styles.label}>Tour Objectives & Target Doctors</Text>
              <TextInput
                style={styles.textArea}
                value={objectives}
                onChangeText={setObjectives}
                placeholder="e.g. Launch new cardiovascular molecule to key cardiologists & follow up on chemist orders"
                placeholderTextColor="#94A3B8"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </ScrollView>

            <View style={styles.footer}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setIsCreateOpen(false)}
                disabled={isSubmitting}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.submitBtn}
                onPress={handleCreateTour}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="send" size={16} color="#FFFFFF" />
                    <Text style={styles.submitBtnText}>Submit Tour Plan</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    justifyContent: "flex-end",
  },
  sheetContainer: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    height: "90%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
  },
  subtitle: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: "#64748B",
  },
  scrollList: {
    padding: spacing.lg,
    paddingBottom: 40,
    gap: 10,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#334155",
    marginTop: spacing.md,
  },
  emptySubtitle: {
    fontSize: 12,
    color: "#64748B",
    textAlign: "center",
    marginTop: 6,
    paddingHorizontal: spacing.xl,
  },
  tourCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  tourHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  tourTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0F172A",
    flexShrink: 1,
    marginRight: 8,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "700",
  },
  datesRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  datesText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0D5C46",
  },
  routeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  routeText: {
    fontSize: 12,
    color: "#475569",
    fontWeight: "600",
  },
  objectivesText: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
    lineHeight: 16,
  },
  rejectionNotice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FEF2F2",
    padding: 8,
    borderRadius: radii.md,
    marginTop: 8,
  },
  rejectionReasonText: {
    fontSize: 11,
    color: "#DC2626",
    fontWeight: "600",
    flexShrink: 1,
  },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    backgroundColor: "#FFFFFF",
  },
  createBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: radii.lg,
  },
  createBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  body: {
    padding: spacing.lg,
    gap: 10,
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: "#334155",
    marginBottom: 4,
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: radii.md,
    backgroundColor: "#F8FAFC",
    paddingHorizontal: spacing.sm,
    height: 44,
    fontSize: 14,
    color: "#0F172A",
  },
  dateInputsRow: {
    flexDirection: "row",
    gap: 10,
  },
  dateField: {
    flex: 1,
  },
  textArea: {
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: radii.md,
    backgroundColor: "#F8FAFC",
    padding: spacing.sm,
    fontSize: 14,
    color: "#0F172A",
    minHeight: 70,
  },
  cancelBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748B",
  },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: radii.md,
  },
  submitBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
