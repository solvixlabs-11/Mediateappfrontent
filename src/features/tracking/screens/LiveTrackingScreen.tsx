import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StatusBar as RNStatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { WebView } from "react-native-webview";
import { usersApi } from "../../users/api/usersApi";

export interface TrackableUser {
  id: number;
  name: string;
  hq: string;
  avatarUrl?: string;
  status: "PUNCHED IN HERE" | "PUNCHED OUT HERE" | "IN FIELD TRANSIT" | "DOCTOR CALL ACTIVE";
  address: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  lastUpdated: string;
  routeHistory?: Array<{ latitude: number; longitude: number }>;
}

const DEFAULT_TRACKABLE_USERS: TrackableUser[] = [
  {
    id: 1,
    name: "ABDUL AYAZ KHAN",
    hq: "ROURKELA, ROURKELA",
    status: "PUNCHED IN HERE",
    address: "3R4M+821, Main Road, Udit Nagar, Rourkela, Odisha 769012, India",
    coordinates: { latitude: 22.2254, longitude: 84.8546 },
    lastUpdated: "07-10-2026 06:15 PM",
    routeHistory: [
      { latitude: 22.2200, longitude: 84.8500 },
      { latitude: 22.2230, longitude: 84.8520 },
      { latitude: 22.2254, longitude: 84.8546 },
    ],
  },
  {
    id: 2,
    name: "ABHINAV DUBEY",
    hq: "VARANASI..",
    avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80",
    status: "PUNCHED OUT HERE",
    address: "6QJR+693, Pilori, Uttar Pradesh 231314, India",
    coordinates: { latitude: 25.3176, longitude: 82.9739 },
    lastUpdated: "07-10-2026 06:36 PM",
    routeHistory: [
      { latitude: 25.3100, longitude: 82.9650 },
      { latitude: 25.3140, longitude: 82.9700 },
      { latitude: 25.3176, longitude: 82.9739 },
    ],
  },
  {
    id: 3,
    name: "ABINASH NANDA",
    hq: "CUTTACK",
    status: "DOCTOR CALL ACTIVE",
    address: "7P9X+445, Badambadi Bus Stand Road, Cuttack, Odisha 753012, India",
    coordinates: { latitude: 20.4625, longitude: 85.8828 },
    lastUpdated: "07-10-2026 05:50 PM",
  },
  {
    id: 4,
    name: "AJAY JHA",
    hq: "JAMSHEDPUR.",
    status: "PUNCHED IN HERE",
    address: "9M4Q+229, Bistupur Main Road, Jamshedpur, Jharkhand 831001, India",
    coordinates: { latitude: 22.8046, longitude: 86.2029 },
    lastUpdated: "07-10-2026 06:22 PM",
  },
  {
    id: 5,
    name: "AJAY KUMAR",
    hq: "AHMEDABAD..",
    status: "IN FIELD TRANSIT",
    address: "3H77+6QP, S.G. Highway, Bodakdev, Ahmedabad, Gujarat 380054, India",
    coordinates: { latitude: 23.0338, longitude: 72.5133 },
    lastUpdated: "07-10-2026 06:30 PM",
    routeHistory: [
      { latitude: 23.0200, longitude: 72.5000 },
      { latitude: 23.0280, longitude: 72.5080 },
      { latitude: 23.0338, longitude: 72.5133 },
    ],
  },
  {
    id: 6,
    name: "AKRAM CHUDASAMA",
    hq: "JAMNAGAR",
    status: "PUNCHED IN HERE",
    address: "2W99+11A, Ranjit Road, Jamnagar, Gujarat 361001, India",
    coordinates: { latitude: 22.4707, longitude: 70.0577 },
    lastUpdated: "07-10-2026 06:05 PM",
  },
  {
    id: 7,
    name: "ALPESH BALDANIYA",
    hq: "SURAT",
    status: "DOCTOR CALL ACTIVE",
    address: "4V88+99C, Ring Road, Majura Gate, Surat, Gujarat 395002, India",
    coordinates: { latitude: 21.1702, longitude: 72.8311 },
    lastUpdated: "07-10-2026 06:12 PM",
  },
  {
    id: 8,
    name: "AMIT SHUKLA",
    hq: "LUCKNOW",
    status: "PUNCHED OUT HERE",
    address: "5F22+881, Hazratganj, Lucknow, Uttar Pradesh 226001, India",
    coordinates: { latitude: 26.8467, longitude: 80.9462 },
    lastUpdated: "07-10-2026 06:40 PM",
  },
  {
    id: 9,
    name: "AMIT SWAIN",
    hq: "BHUBANESWAR",
    status: "PUNCHED IN HERE",
    address: "6G44+331, Saheed Nagar, Bhubaneswar, Odisha 751007, India",
    coordinates: { latitude: 20.2961, longitude: 85.8245 },
    lastUpdated: "07-10-2026 05:45 PM",
  },
];

export function LiveTrackingScreen() {
  const navigation = useNavigation();
  const webViewRef = useRef<WebView>(null);

  const [isOptionsExpanded, setIsOptionsExpanded] = useState(true);
  const [usersList, setUsersList] = useState<TrackableUser[]>(DEFAULT_TRACKABLE_USERS);
  const [selectedUser, setSelectedUser] = useState<TrackableUser | null>(null);
  const [tempSelectedUser, setTempSelectedUser] = useState<TrackableUser | null>(null);

  const [isPersonModalOpen, setIsPersonModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [mapType, setMapType] = useState<"standard" | "satellite">("standard");

  useEffect(() => {
    // Fetch real-time live staff locations & telemetry from API
    usersApi
      .getLiveTracking()
      .then((items) => {
        if (items && items.length > 0) {
          const mapped: TrackableUser[] = items.map((u) => ({
            id: u.id,
            name: u.name,
            hq: u.hq,
            avatarUrl: u.avatar_url,
            status: u.status,
            address: u.address,
            coordinates: {
              latitude: u.coordinates.latitude,
              longitude: u.coordinates.longitude,
            },
            lastUpdated: u.last_updated,
            routeHistory: u.route_history,
          }));
          setUsersList(mapped);
        }
      })
      .catch(() => {
        // Fallback to local catalog if offline
      });
  }, []);

  const handleOpenPersonPicker = () => {
    setTempSelectedUser(selectedUser);
    setIsPersonModalOpen(true);
  };

  const handleConfirmPerson = () => {
    setSelectedUser(tempSelectedUser);
    setIsPersonModalOpen(false);
    setIsMapLoaded(false);
  };

  const handleGetLocation = () => {
    if (!selectedUser) return;
    setIsLoadingLocation(true);
    setTimeout(() => {
      setIsLoadingLocation(false);
      setIsMapLoaded(true);
    }, 500);
  };

  const handleClearPerson = () => {
    setSelectedUser(null);
    setTempSelectedUser(null);
    setIsMapLoaded(false);
  };

  const handleOpenExternalGoogleMaps = () => {
    if (!selectedUser) return;
    const { latitude, longitude } = selectedUser.coordinates;
    const url = Platform.select({
      ios: `maps:0,0?q=${latitude},${longitude}`,
      android: `geo:0,0?q=${latitude},${longitude}(${encodeURIComponent(selectedUser.name)})`,
      default: `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`,
    });
    Linking.openURL(url!).catch(() => {
      Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`);
    });
  };

  const handleRecenter = () => {
    if (webViewRef.current && selectedUser) {
      const { latitude, longitude } = selectedUser.coordinates;
      webViewRef.current.injectJavaScript(`
        if (window.map) {
          window.map.setView([${latitude}, ${longitude}], 16);
          if (window.marker) {
            window.marker.openPopup();
          }
        }
        true;
      `);
    }
  };

  const handleToggleMapType = () => {
    const nextType = mapType === "standard" ? "satellite" : "standard";
    setMapType(nextType);
    if (webViewRef.current) {
      webViewRef.current.injectJavaScript(`
        if (window.setMapLayer) {
          window.setMapLayer('${nextType}');
        }
        true;
      `);
    }
  };

  const filteredUsers = usersList.filter(
    (u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
      u.hq.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  // HTML content rendering interactive Google / Leaflet map tiles
  const generateMapHtml = (user: TrackableUser) => {
    const lat = user.coordinates.latitude;
    const lng = user.coordinates.longitude;
    const userName = user.name;
    const userStatus = user.status;
    const userAddress = user.address;
    const routeCoords = user.routeHistory ? JSON.stringify(user.routeHistory.map((p) => [p.latitude, p.longitude])) : "[]";

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
          <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
          <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
          <style>
            html, body, #map {
              height: 100%;
              width: 100%;
              margin: 0;
              padding: 0;
              background-color: #e5f0df;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            }
            .custom-marker {
              position: relative;
            }
            .pulse-ring {
              position: absolute;
              top: -15px;
              left: -15px;
              width: 60px;
              height: 60px;
              border-radius: 50%;
              background: rgba(225, 29, 72, 0.25);
              animation: pulse 2s infinite ease-out;
            }
            @keyframes pulse {
              0% { transform: scale(0.6); opacity: 0.9; }
              100% { transform: scale(1.6); opacity: 0; }
            }
            .marker-icon {
              width: 36px;
              height: 36px;
              border-radius: 18px;
              background: #ffffff;
              border: 3px solid #e11d48;
              box-shadow: 0 4px 10px rgba(0,0,0,0.3);
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 16px;
              color: #e11d48;
              font-weight: bold;
            }
            .leaflet-popup-content-wrapper {
              border-radius: 8px;
              box-shadow: 0 4px 14px rgba(0,0,0,0.2);
              padding: 4px;
            }
            .popup-title {
              font-weight: 800;
              font-size: 13px;
              color: #1e293b;
              margin-bottom: 2px;
            }
            .popup-sub {
              font-size: 11px;
              color: #64748b;
            }
          </style>
        </head>
        <body>
          <div id="map"></div>
          <script>
            var standardLayer = L.tileLayer('https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
              maxZoom: 20,
              attribution: 'Google Maps'
            });

            var satelliteLayer = L.tileLayer('https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
              maxZoom: 20,
              attribution: 'Google Maps Satellite'
            });

            var map = L.map('map', {
              zoomControl: false,
              layers: [standardLayer]
            }).setView([${lat}, ${lng}], 16);
            window.map = map;

            window.setMapLayer = function(type) {
              if (type === 'satellite') {
                map.removeLayer(standardLayer);
                map.addLayer(satelliteLayer);
              } else {
                map.removeLayer(satelliteLayer);
                map.addLayer(standardLayer);
              }
            };

            var customIcon = L.divIcon({
              className: 'custom-marker',
              html: '<div class="pulse-ring"></div><div class="marker-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="#e11d48"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg></div>',
              iconSize: [36, 36],
              iconAnchor: [18, 18]
            });

            var marker = L.marker([${lat}, ${lng}], { icon: customIcon }).addTo(map);
            window.marker = marker;
            marker.bindPopup("<div class='popup-title'>${userName}</div><div class='popup-sub'>${userStatus}</div><div class='popup-sub'>${userAddress}</div>").openPopup();

            // Draw route trail if present
            var routeHistory = ${routeCoords};
            if (routeHistory && routeHistory.length > 1) {
              var polyline = L.polyline(routeHistory, {
                color: '#1B64DA',
                weight: 4,
                opacity: 0.8,
                dashArray: '6, 8'
              }).addTo(map);
            }
          </script>
        </body>
      </html>
    `;
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <RNStatusBar barStyle="light-content" backgroundColor="#1E293B" />

      {/* Top Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Live Tracking</Text>
      </View>

      {/* Select Options Accordion Card */}
      <View style={styles.optionsCard}>
        <TouchableOpacity
          style={styles.optionsHeader}
          onPress={() => setIsOptionsExpanded(!isOptionsExpanded)}
          activeOpacity={0.8}
        >
          <Text style={styles.optionsTitle}>Select Options</Text>
          <Ionicons
            name={isOptionsExpanded ? "chevron-up" : "chevron-down"}
            size={20}
            color="#E11D48"
          />
        </TouchableOpacity>

        {isOptionsExpanded && (
          <View style={styles.optionsBody}>
            {/* Person Input Field */}
            <Text style={styles.fieldLabel}>Person *</Text>
            <TouchableOpacity
              style={styles.personInputField}
              onPress={handleOpenPersonPicker}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.personValueText,
                  !selectedUser && { color: "#94A3B8", fontWeight: "400" },
                ]}
                numberOfLines={1}
              >
                {selectedUser ? `${selectedUser.name} - ${selectedUser.hq}` : ""}
              </Text>
              <View style={styles.fieldIconsRow}>
                {selectedUser ? (
                  <TouchableOpacity
                    onPress={handleClearPerson}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="close" size={20} color="#64748B" />
                  </TouchableOpacity>
                ) : null}
                <Ionicons name="caret-down" size={16} color="#64748B" />
              </View>
            </TouchableOpacity>

            {/* Get Location Button */}
            <View style={styles.btnRow}>
              <TouchableOpacity
                style={[
                  styles.getLocationBtn,
                  selectedUser ? styles.getLocationBtnActive : styles.getLocationBtnDisabled,
                ]}
                onPress={handleGetLocation}
                disabled={!selectedUser || isLoadingLocation}
                activeOpacity={0.8}
              >
                {isLoadingLocation ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text
                    style={[
                      styles.getLocationBtnText,
                      selectedUser
                        ? styles.getLocationBtnTextActive
                        : styles.getLocationBtnTextDisabled,
                    ]}
                  >
                    Get Location
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* Main Map View or Empty State */}
      <View style={styles.mainContainer}>
        {selectedUser && isMapLoaded ? (
          <View style={styles.mapWrapper}>
            {/* Real Interactive Google Maps WebView */}
            <WebView
              ref={webViewRef}
              originWhitelist={["*"]}
              source={{ html: generateMapHtml(selectedUser) }}
              style={styles.mapWebView}
              javaScriptEnabled
              domStorageEnabled
              startInLoadingState
              renderLoading={() => (
                <View style={styles.mapLoadingOverlay}>
                  <ActivityIndicator size="large" color="#1B64DA" />
                  <Text style={styles.mapLoadingText}>Loading Google Maps...</Text>
                </View>
              )}
            />

            {/* Floating Live Telemetry Info Banner at Top of Map */}
            <View style={styles.floatingInfoBanner}>
              <Text style={styles.infoBannerHeader}>
                {selectedUser.name} - {selectedUser.status}
              </Text>
              <Text style={styles.infoBannerAddress} numberOfLines={2}>
                {selectedUser.address}
              </Text>
              <Text style={styles.infoBannerTime}>
                Updated on : {selectedUser.lastUpdated}
              </Text>
            </View>

            {/* Right Map Floating Action Controls */}
            <View style={styles.floatingControlsColumn}>
              {/* Recenter / Focus Button */}
              <TouchableOpacity
                style={styles.mapControlCircle}
                onPress={handleRecenter}
                activeOpacity={0.8}
              >
                <Ionicons name="locate" size={20} color="#1B64DA" />
              </TouchableOpacity>

              {/* Map Layer Switch (Standard / Satellite) */}
              <TouchableOpacity
                style={styles.mapControlCircle}
                onPress={handleToggleMapType}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={mapType === "standard" ? "earth" : "map"}
                  size={20}
                  color="#16A34A"
                />
              </TouchableOpacity>

              {/* Open in Google Maps App */}
              <TouchableOpacity
                style={styles.mapControlCircle}
                onPress={handleOpenExternalGoogleMaps}
                activeOpacity={0.8}
              >
                <Ionicons name="open-outline" size={20} color="#E11D48" />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.emptyStateContainer}>
            <Text style={styles.emptyStateText}>Please Select User</Text>
          </View>
        )}
      </View>

      {/* Person Selection Full-Screen Modal (Exact MR Buddy design) */}
      <Modal visible={isPersonModalOpen} animationType="slide" transparent={false}>
        <SafeAreaView style={styles.modalSafeArea} edges={["top", "left", "right", "bottom"]}>
          <RNStatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

          {/* Modal Title */}
          <View style={styles.modalHeaderRow}>
            <Text style={styles.personModalTitle}>Person</Text>
          </View>

          {/* Outlined Red Search Input with floating label */}
          <View style={styles.searchContainer}>
            <View style={styles.outlinedSearchBox}>
              <View style={styles.floatingSearchLabel}>
                <Text style={styles.floatingSearchLabelText}>Search</Text>
              </View>
              <TextInput
                style={styles.personSearchInput}
                placeholder=""
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
              />
            </View>
          </View>

          {/* Person List */}
          <FlatList
            data={filteredUsers}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.personListContent}
            renderItem={({ item }) => {
              const isChecked = tempSelectedUser?.id === item.id;
              return (
                <TouchableOpacity
                  style={styles.personRowItem}
                  onPress={() => setTempSelectedUser(item)}
                  activeOpacity={0.7}
                >
                  {/* Profile Avatar */}
                  <View style={styles.personAvatarContainer}>
                    {item.avatarUrl ? (
                      <Image source={{ uri: item.avatarUrl }} style={styles.personAvatarImg} />
                    ) : (
                      <View style={styles.personAvatarPlaceholder}>
                        <Ionicons name="image-outline" size={20} color="#94A3B8" />
                      </View>
                    )}
                  </View>

                  {/* Name and HQ */}
                  <View style={styles.personDetailsCol}>
                    <Text style={styles.personRowName}>{item.name}</Text>
                    <Text style={styles.personRowHq}>{item.hq}</Text>
                  </View>

                  {/* Checkbox */}
                  <View
                    style={[
                      styles.checkboxSquare,
                      isChecked && styles.checkboxSquareChecked,
                    ]}
                  >
                    {isChecked && <Ionicons name="checkmark" size={18} color="#FFFFFF" />}
                  </View>
                </TouchableOpacity>
              );
            }}
          />

          {/* Bottom OK Button */}
          <View style={styles.modalBottomBar}>
            <TouchableOpacity
              style={styles.okButton}
              onPress={handleConfirmPerson}
              activeOpacity={0.8}
            >
              <Text style={styles.okButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
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
  backButton: {
    padding: 4,
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "600",
  },
  optionsCard: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  optionsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  optionsTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#E11D48",
  },
  optionsBody: {
    marginTop: 12,
  },
  fieldLabel: {
    fontSize: 12,
    color: "#475569",
    fontWeight: "500",
    marginBottom: 4,
  },
  personInputField: {
    borderBottomWidth: 1,
    borderBottomColor: "#CBD5E1",
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 34,
  },
  personValueText: {
    fontSize: 14,
    color: "#1E293B",
    fontWeight: "700",
    flex: 1,
  },
  fieldIconsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  btnRow: {
    alignItems: "center",
    marginTop: 16,
    marginBottom: 4,
  },
  getLocationBtn: {
    paddingVertical: 10,
    paddingHorizontal: 28,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 140,
  },
  getLocationBtnDisabled: {
    backgroundColor: "#E2E8F0",
  },
  getLocationBtnActive: {
    backgroundColor: "#E11D48",
    shadowColor: "#E11D48",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 3,
  },
  getLocationBtnText: {
    fontSize: 14,
    fontWeight: "700",
  },
  getLocationBtnTextDisabled: {
    color: "#94A3B8",
  },
  getLocationBtnTextActive: {
    color: "#FFFFFF",
  },
  mainContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  emptyStateContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  emptyStateText: {
    fontSize: 15,
    color: "#64748B",
    fontWeight: "500",
  },
  mapWrapper: {
    flex: 1,
    position: "relative",
  },
  mapWebView: {
    flex: 1,
    backgroundColor: "#E5F0DF",
  },
  mapLoadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  mapLoadingText: {
    fontSize: 13,
    color: "#64748B",
    fontWeight: "600",
  },
  floatingInfoBanner: {
    position: "absolute",
    top: 12,
    left: 12,
    right: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 6,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  infoBannerHeader: {
    fontSize: 13,
    fontWeight: "800",
    color: "#1E293B",
    textAlign: "center",
    marginBottom: 4,
  },
  infoBannerAddress: {
    fontSize: 12,
    color: "#475569",
    textAlign: "center",
    marginBottom: 4,
  },
  infoBannerTime: {
    fontSize: 11,
    color: "#64748B",
    textAlign: "center",
  },
  floatingControlsColumn: {
    position: "absolute",
    bottom: 24,
    right: 16,
    gap: 12,
    alignItems: "center",
  },
  mapControlCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  modalSafeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  modalHeaderRow: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  personModalTitle: {
    fontSize: 22,
    fontWeight: "600",
    color: "#1E293B",
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  outlinedSearchBox: {
    borderWidth: 1.5,
    borderColor: "#E11D48",
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    position: "relative",
  },
  floatingSearchLabel: {
    position: "absolute",
    top: -9,
    left: 10,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 4,
  },
  floatingSearchLabelText: {
    fontSize: 11,
    color: "#E11D48",
    fontWeight: "700",
  },
  personSearchInput: {
    fontSize: 15,
    color: "#1E293B",
    padding: 0,
    minHeight: 28,
  },
  personListContent: {
    paddingHorizontal: 20,
    paddingBottom: 80,
  },
  personRowItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F8FAFC",
  },
  personAvatarContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: "hidden",
    marginRight: 14,
  },
  personAvatarImg: {
    width: "100%",
    height: "100%",
  },
  personAvatarPlaceholder: {
    width: "100%",
    height: "100%",
    borderRadius: 22,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  personDetailsCol: {
    flex: 1,
  },
  personRowName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1E293B",
    letterSpacing: 0.3,
  },
  personRowHq: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  checkboxSquare: {
    width: 22,
    height: 22,
    borderWidth: 2,
    borderColor: "#64748B",
    borderRadius: 3,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxSquareChecked: {
    backgroundColor: "#E11D48",
    borderColor: "#E11D48",
  },
  modalBottomBar: {
    position: "absolute",
    bottom: 20,
    right: 20,
  },
  okButton: {
    backgroundColor: "#E11D48",
    paddingVertical: 10,
    paddingHorizontal: 28,
    borderRadius: 4,
    shadowColor: "#E11D48",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  okButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
});
