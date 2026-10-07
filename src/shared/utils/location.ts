import * as Location from "expo-location";

export interface GeoLocationResult {
  latitude: number;
  longitude: number;
  accuracy: number;
  address: string;
  mock_location_flag: boolean;
}

// Fallback coordinates (Mumbai HQ) in case device has no GPS or permissions denied
const FALLBACK_LOCATION: GeoLocationResult = {
  latitude: 19.0760,
  longitude: 72.8777,
  accuracy: 12.5,
  address: "Dadar West, Mumbai, Maharashtra 400028",
  mock_location_flag: false,
};

/**
 * Capture high-accuracy device GPS coordinates and reverse geocode to address.
 */
export async function getCurrentGeoLocation(): Promise<GeoLocationResult> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      console.warn("Location permission not granted, using fallback coordinates.");
      return FALLBACK_LOCATION;
    }

    // High accuracy position
    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });

    const lat = position.coords.latitude;
    const lng = position.coords.longitude;
    const accuracy = position.coords.accuracy || 10.0;
    const isMock = position.mocked ?? false;

    // Reverse geocode to human-readable address
    let addressText = "Field Location";
    try {
      const geocode = await Location.reverseGeocodeAsync({
        latitude: lat,
        longitude: lng,
      });

      if (geocode && geocode.length > 0) {
        const g = geocode[0];
        const parts = [
          g.name,
          g.street,
          g.district || g.subregion,
          g.city,
          g.region,
          g.postalCode,
        ].filter(Boolean);
        if (parts.length > 0) {
          addressText = parts.join(", ");
        }
      }
    } catch (geoErr) {
      console.warn("Reverse geocode failed, using lat/lng string:", geoErr);
      addressText = `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`;
    }

    return {
      latitude: lat,
      longitude: lng,
      accuracy,
      address: addressText,
      mock_location_flag: isMock,
    };
  } catch (err) {
    console.error("Failed to get device GPS location:", err);
    return FALLBACK_LOCATION;
  }
}
