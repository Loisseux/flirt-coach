import { Capacitor } from "@capacitor/core";

export const APP_BASE_URL =
  import.meta.env.VITE_APP_URL?.replace(/\/$/, "") || "https://quippr.app";

export const SUPPORT_EMAIL = "flirtcoachapp@gmail.com";

export function getPrivacyPolicyUrl(): string {
  return `${APP_BASE_URL}/privacy-policy.html`;
}

export function getTermsUrl(): string {
  return `${APP_BASE_URL}/terms.html`;
}

/** Apple Standard EULA for auto-renewable subscriptions (App Store requirement). */
export const APPLE_SUBSCRIPTION_TERMS_URL =
  "https://www.apple.com/legal/internet-services/itunes/dev/stdeula/";

export function getSupportMailtoUrl(): string {
  const subject = encodeURIComponent("Quippr Support");
  return `mailto:${SUPPORT_EMAIL}?subject=${subject}`;
}

/** Open an http(s) URL in the system browser on native, or a new tab on web. */
export async function openInBrowser(url: string): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    const { Browser } = await import("@capacitor/browser");
    await Browser.open({ url });
    return;
  }
  window.open(url, "_blank", "noopener,noreferrer");
}

/** Open the default mail client with a pre-filled support email. */
export async function openSupportEmail(): Promise<void> {
  const url = getSupportMailtoUrl();
  if (Capacitor.isNativePlatform()) {
    const { App } = await import("@capacitor/app");
    await App.openUrl({ url });
    return;
  }
  window.location.href = url;
}
