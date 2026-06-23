import { Capacitor } from "@capacitor/core";

export const PREMIUM_ENTITLEMENT_ID = "premium";

export const REVENUECAT_IOS_API_KEY =
  import.meta.env.VITE_REVENUECAT_IOS_API_KEY ?? "appl_xxGujBhoEKYUwzYvOHrdgrvaSom";

export const REVENUECAT_ANDROID_API_KEY =
  import.meta.env.VITE_REVENUECAT_ANDROID_API_KEY ?? "goog_UGssLoTMqWXsCmHIDJVnMSDjKxb";

export function getRevenueCatApiKey(): string | null {
  if (!Capacitor.isNativePlatform()) return null;
  return Capacitor.getPlatform() === "ios" ? REVENUECAT_IOS_API_KEY : REVENUECAT_ANDROID_API_KEY;
}

export function isRevenueCatAvailable(): boolean {
  return getRevenueCatApiKey() != null;
}
