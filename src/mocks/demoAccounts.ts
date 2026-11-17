import { DemoAccount } from "../features/auth/api/authApi";

/**
 * Development fallback accounts.
 * Active ONLY when EXPO_PUBLIC_DEV_LOGIN === "true".
 * In production or standard builds, credentials must come from backend /api/v1/auth/config.
 */
export const DEV_DEMO_ACCOUNTS: DemoAccount[] = [
  {
    role: "ADMIN",
    email: "admin@mediate.com",
    password: "Password123!",
    label: "Super Admin",
  },
  {
    role: "MANAGER",
    email: "manager@mediate.com",
    password: "Password123!",
    label: "Area Manager",
  },
  {
    role: "MR",
    email: "mr1@mediate.com",
    password: "Password123!",
    label: "Medical Rep",
  },
];

