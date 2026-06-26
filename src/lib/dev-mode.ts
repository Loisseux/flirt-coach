const DEV_PREMIUM_EMAIL = "demo@quippr.app";
export const DEV_MODE_STORAGE_KEY = "quippr_dev_mode";

export function hasDevPremiumBypass(email: string | undefined | null): boolean {
  if (import.meta.env.VITE_QUIPPR_DEV_MODE === "true") return true;
  if (email === DEV_PREMIUM_EMAIL) return true;

  try {
    return localStorage.getItem(DEV_MODE_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}
