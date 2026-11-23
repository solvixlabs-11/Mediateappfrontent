import * as Location from "expo-location";
import { getCurrentGeoLocation } from "../location";

jest.mock("expo-location", () => ({
  requestForegroundPermissionsAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
  reverseGeocodeAsync: jest.fn(),
  Accuracy: {
    High: 6,
  },
}));

describe("Auto-Detect GeoLocation & Address Extraction Utility", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns fallback coordinates and structured address when permission is not granted", async () => {
    (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({
      status: "denied",
    });

    const result = await getCurrentGeoLocation();

    expect(result.latitude).toBe(19.076);
    expect(result.longitude).toBe(72.8777);
    expect(result.city).toBe("Mumbai");
    expect(result.area).toBe("Dadar");
    expect(result.state).toBe("Maharashtra");
    expect(result.pincode).toBe("400028");
    expect(result.address).toContain("Mumbai");
  });

  it("extracts structured address fields when high-accuracy GPS and geocode succeed", async () => {
    (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({
      status: "granted",
    });

    (Location.getCurrentPositionAsync as jest.Mock).mockResolvedValue({
      coords: {
        latitude: 23.0753,
        longitude: 72.5314,
        accuracy: 8.5,
      },
      mocked: false,
    });

    (Location.reverseGeocodeAsync as jest.Mock).mockResolvedValue([
      {
        name: "Shop 12",
        street: "C.G. Road",
        district: "Navrangpura",
        subregion: "Ahmedabad",
        city: "Ahmedabad",
        region: "Gujarat",
        postalCode: "380009",
      },
    ]);

    const result = await getCurrentGeoLocation();

    expect(result.latitude).toBe(23.0753);
    expect(result.longitude).toBe(72.5314);
    expect(result.accuracy).toBe(8.5);
    expect(result.addressLine1).toBe("Shop 12 C.G. Road");
    expect(result.area).toBe("Navrangpura");
    expect(result.city).toBe("Ahmedabad");
    expect(result.state).toBe("Gujarat");
    expect(result.pincode).toBe("380009");
    expect(result.address).toContain("Shop 12 C.G. Road");
    expect(result.address).toContain("Gujarat");
  });

  it("falls back gracefully when reverse geocoding throws an error", async () => {
    (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({
      status: "granted",
    });

    (Location.getCurrentPositionAsync as jest.Mock).mockResolvedValue({
      coords: {
        latitude: 28.6139,
        longitude: 77.209,
        accuracy: 15.0,
      },
      mocked: false,
    });

    (Location.reverseGeocodeAsync as jest.Mock).mockRejectedValue(new Error("Network timeout"));

    const result = await getCurrentGeoLocation();

    expect(result.latitude).toBe(28.6139);
    expect(result.longitude).toBe(77.209);
    expect(result.accuracy).toBe(15.0);
    expect(result.address).toBeDefined();
  });
});
