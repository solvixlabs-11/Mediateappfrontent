# Mediate Healthcare MR Mobile App

A cross-platform React Native & Expo mobile application purpose-built for Mediate Healthcare field medical representatives, regional managers, and administrators.

---

## 📱 Role-Based Navigation & Workspaces

The application automatically provisions role-tailored bottom tab navigation upon login:

| Role | Bottom Tabs | Key Screen Workspaces |
| :--- | :--- | :--- |
| **MR (Medical Rep)** | `Planner` • `Visits` • `DCR` • `Orders` • `Profile` | - **Operations Dashboard (`Planner`)**: Field work GPS punch-in/out, live greeting, target metrics, Next Up visit detailing, quick action tiles.<br>- **Visits**: Daily planned beats, geofence status, visit timeline.<br>- **DCR**: Customer directory & call report launcher.<br>- **Profile**: Account settings, photo upload, logout. |
| **Manager** | `Home` • `Team` • `Approvals` • `Tasks` • `Profile` | - **Team**: Real-time list of reporting MRs, contact details, attendance status.<br>- **Approvals Inbox**: Review Tour Programs, Expense Claims, and Leaves with Approve/Reject flows. |
| **Admin** | `Home` • `Users` • `Masters` • `Reports` • `Profile` | - **Users**: Create new MR/Managers with validation, assign reporting managers.<br>- **Masters**: Configure States, Cities, Areas, and territories. |

---

## 🛠️ Tech Stack & Key Libraries

- **Framework**: React Native with Expo SDK 57 (Development Client)
- **Language**: TypeScript (`tsc --noEmit` verified)
- **State Management**: Zustand (`useAuthStore`)
- **Secure Storage**: `expo-secure-store` for access and refresh token persistence
- **Networking**: Axios with automatic JWT silent refresh rotation interceptors
- **Location**: `expo-location` for GPS punch-in accuracy and server-side geofencing
- **Icons**: `@expo/vector-icons` (Ionicons)
- **API Typing**: `openapi-typescript` auto-generated from backend `/openapi.json`

---

## 🚀 Running Locally

### 1. Prerequisites
- Node.js LTS (v20+ or v24)
- Expo Go or Expo Development Client on an Android/iOS device or emulator

### 2. Environment Configuration
Create `.env` file in the root of `Mediateappfrontent`:
```ini
EXPO_PUBLIC_API_URL=http://<YOUR_LAN_IP>:8000
```
*(Replace `<YOUR_LAN_IP>` with your computer's local Wi-Fi IP address so the mobile device can reach the backend over LAN).*

### 3. Installation & Start
```powershell
npm install
npx expo start
```
- Press `a` to open in Android Emulator, or scan the QR code using Expo Dev Client on a physical phone.

---

## 🧪 Code Validation & Type Generation

```powershell
# Typecheck entire application
npm run typecheck

# Regenerate API TypeScript types from backend OpenAPI specification
npm run gen:api
```

---

## 📂 Project Structure

```
src/
├── api/                  # Axios client, interceptors & generated schema.d.ts
├── features/
│   ├── attendance/       # AttendanceCard, punch-in/out APIs & location hooks
│   ├── approvals/        # Manager Approvals Inbox & decision modals
│   ├── auth/             # LoginScreen, store, SecureStore persistence
│   ├── customers/        # Doctors, Chemists, Stockists lists & detail modals
│   ├── dashboard/        # MrDashboardScreen (high-converting MR field cockpit)
│   ├── dcr/              # Daily Call Report multi-step form & planned visits
│   ├── expenses/         # Expense claims list, add modal, monthly summaries
│   ├── leaves/           # Leave balances, apply modal, cancellation flows
│   ├── masters/          # Admin master data editors
│   ├── profile/          # User profile & logout
│   ├── territories/      # Territory assignments
│   └── users/            # Users list, creation modal & team screen
├── navigation/           # RootNavigator & RoleTabNavigator
└── shared/theme/         # Design system tokens (colors, radii, spacing, typography)
```
