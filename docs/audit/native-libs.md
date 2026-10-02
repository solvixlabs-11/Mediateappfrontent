# Native Dependencies Audit

Date: 2026-10-02
Project: Mediate MR Mobile App (`Mediateappfrontent`)

---

## 1. Native Dependencies in `package.json`

| Library | Version in `package.json` | Feature(s) Using It | Included in Initial Dev Build (P0)? | Needs Dev Build Rebuild? |
|---|---|---|---|---|
| `expo-dev-client` | `~57.0.19` | Dev client runtime | Yes / Pending rebuild | No |
| `expo-secure-store` | `~57.0.4` | Auth session & token storage | Yes / Pending rebuild | No |
| `expo-sqlite` | `~57.0.3` | Offline outbox & local storage | Yes / Pending rebuild | No |
| `expo-status-bar` | `~57.0.1` | App-wide status bar style | Yes / Pending rebuild | No |
| `@react-native-community/netinfo` | `12.0.1` | Network state & offline banner | Yes / Pending rebuild | No |
| `react-native-screens` | `~4.26.0` | Navigation native container | Yes / Pending rebuild | No |
| `react-native-safe-area-context` | `~5.7.0` | Insets & notch/punch-hole handling | Yes / Pending rebuild | No |
| `expo-image-picker` | `^57.0.20` | Profile photo upload, Expense receipts | **No (added in P1/P5)** | **YES** |
| `@expo/vector-icons` | `^15.1.1` | UI icons across all screens | Partial (requires `expo-font`) | **YES** |

---

## 2. Missing Native Dependencies Required by Feature Specs

| Missing Library | Required by Feature(s) | Phase | Status | Action Required |
|---|---|---|---|---|
| `expo-font` | Required peer dependency for `@expo/vector-icons` | P0/P1 | Missing (flagged by `expo-doctor`) | Run `npx expo install expo-font` |
| `expo-location` | Attendance check-in (P3), DCR visit location (P4), Nearby (P2) | P3 | Missing in `package.json` | Run `npx expo install expo-location` |
| `react-native-maps` | LocationCard preview (P2/P3), Team Map (P7), Route Map (P7) | P2/P7 | Missing in `package.json` | Install when entering map features or stub with webview/intent |

---

## 3. Summary & Dev Build Recommendation
- **Dev Build Status**: **REBUILD REQUIRED**.
- **Reason**: `expo-image-picker` was added after Phase 0 dev build was initialized; `expo-font` is missing for vector icons; `expo-location` is required for Attendance GPS check-in (P3) and DCR visit coordinates (P4). Running these on a device with an outdated dev client APK will cause native module crashes ("Cannot find native module").
