import * as Location from "expo-location";

export interface GeoLocationResult {
  latitude: number;
  longitude: number;
  accuracy: number;
  address: string;
  addressLine1?: string;
  addressLine2?: string;
  area?: string;
  city?: string;
  district?: string;
  state?: string;
  pincode?: string;
  mock_location_flag: boolean;
}

// Fallback coordinates (Mumbai HQ) in case device has no GPS or permissions denied
const FALLBACK_LOCATION: GeoLocationResult = {
  latitude: 19.0760,
  longitude: 72.8777,
  accuracy: 12.5,
  address: "Dadar West, Mumbai, Maharashtra 400028",
  addressLine1: "Dadar West",
  addressLine2: "",
  area: "Dadar",
  city: "Mumbai",
  district: "Mumbai City",
  state: "Maharashtra",
  pincode: "400028",
  mock_location_flag: false,
};

/**
 * Capture high-accuracy device GPS coordinates and reverse geocode to address fields.
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

    let addressLine1 = "";
    let area = "";
    let city = "";
    let district = "";
    let state = "";
    let pincode = "";
    let fullAddress = "";

    // 1. Try native expo-location reverse geocoding
    try {
      const geocode = await Location.reverseGeocodeAsync({
        latitude: lat,
        longitude: lng,
      });

      if (geocode && geocode.length > 0) {
        const g = geocode[0];
        const streetParts = [g.name, g.street].filter(Boolean);
        addressLine1 = streetParts.join(" ") || g.name || g.street || "";
        area = g.district || g.subregion || "";
        city = g.city || "";
        district = g.subregion || g.district || city || "";
        state = g.region || "";
        pincode = g.postalCode || "";

        const allParts = [
          addressLine1,
          area,
          city,
          district !== city ? district : "",
          state,
          pincode,
        ].filter(Boolean);
        if (allParts.length > 0) {
          fullAddress = allParts.join(", ");
        }
      }
    } catch (geoErr) {
      console.warn("Expo reverse geocode failed, falling back to Nominatim / coordinates:", geoErr);
    }

    // 2. Fallback / Enrichment with OpenStreetMap Nominatim if city or area is missing
    if (!city || !area) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3500);

        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
          {
            signal: controller.signal,
            headers: {
              "User-Agent": "MediateHealthcare-MR-App/1.0",
              "Accept-Language": "en-US,en;q=0.9",
            },
          }
        );
        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();
          const addr = data.address || {};
          if (!addressLine1) {
            addressLine1 = [addr.house_number, addr.road || addr.building].filter(Boolean).join(" ");
          }
          if (!area) {
            area = addr.suburb || addr.neighbourhood || addr.residential || addr.subdistrict || "";
          }
          if (!city) {
            city = addr.city || addr.town || addr.village || addr.municipality || "";
          }
          if (!district) {
            district = addr.state_district || addr.county || city || "";
          }
          if (!state) {
            state = addr.state || "";
          }
          if (!pincode) {
            pincode = addr.postcode || "";
          }
          if (!fullAddress && data.display_name) {
            fullAddress = data.display_name;
          }
        }
      } catch (nomErr) {
        console.warn("Nominatim fallback reverse-geocode error or timeout:", nomErr);
      }
    }

    if (!fullAddress) {
      const parts = [addressLine1, area, city, state, pincode].filter(Boolean);
      fullAddress = parts.length > 0 ? parts.join(", ") : `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`;
    }

    return {
      latitude: lat,
      longitude: lng,
      accuracy,
      address: fullAddress,
      addressLine1,
      addressLine2: "",
      area,
      city,
      district,
      state,
      pincode,
      mock_location_flag: isMock,
    };
  } catch (err) {
    console.error("Failed to get device GPS location:", err);
    return FALLBACK_LOCATION;
  }
}
