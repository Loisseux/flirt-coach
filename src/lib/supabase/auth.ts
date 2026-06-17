import { Capacitor } from "@capacitor/core";
import { supabase } from "./client";

const NATIVE_OAUTH_CALLBACK = "com.quippr.app://auth/callback";

/** OAuth redirect URL after sign-in (must be listed in Supabase → Auth → URL Configuration). */
export function getOAuthRedirectUrl(): string {
  if (Capacitor.isNativePlatform()) {
    return NATIVE_OAUTH_CALLBACK;
  }

  const base = import.meta.env.VITE_APP_URL?.replace(/\/$/, "") || window.location.origin;
  return `${base}/app`;
}

async function closeOAuthBrowser() {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const { Browser } = await import("@capacitor/browser");
    await Browser.close();
  } catch {
    // Browser may already be closed.
  }
}

/** Complete OAuth from a native deep-link callback URL. */
export async function handleOAuthCallback(url: string): Promise<{ error: string | null }> {
  try {
    const parsed = new URL(url);
    const code = parsed.searchParams.get("code");
    const errorDescription = parsed.searchParams.get("error_description");

    if (errorDescription) {
      return { error: decodeURIComponent(errorDescription.replace(/\+/g, " ")) };
    }

    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      await closeOAuthBrowser();
      return { error: error?.message ?? null };
    }

    // Implicit-flow fallback (tokens in hash)
    const hash = parsed.hash.startsWith("#") ? parsed.hash.slice(1) : parsed.hash;
    const params = new URLSearchParams(hash);
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");

    if (accessToken && refreshToken) {
      const { error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      await closeOAuthBrowser();
      return { error: error?.message ?? null };
    }

    return { error: null };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export async function signInWithOAuthProvider(
  provider: "google" | "apple",
): Promise<{ error: string | null }> {
  const redirectTo = getOAuthRedirectUrl();
  const isNative = Capacitor.isNativePlatform();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo,
      skipBrowserRedirect: isNative,
      ...(provider === "apple" ? { scopes: "email name" } : {}),
    },
  });

  if (error) return { error: error.message };

  if (isNative && data.url) {
    const { Browser } = await import("@capacitor/browser");
    await Browser.open({ url: data.url });
  }

  return { error: null };
}

export function registerNativeOAuthListener(
  onError: (message: string) => void,
): () => void {
  if (!Capacitor.isNativePlatform()) return () => {};

  let removed = false;
  let listenerPromise: Promise<{ remove: () => void }> | null = null;

  void (async () => {
    const { App } = await import("@capacitor/app");
    const handle = await App.addListener("appUrlOpen", ({ url }) => {
      if (!url.startsWith(NATIVE_OAUTH_CALLBACK)) return;
      void handleOAuthCallback(url).then((result) => {
        if (result.error) onError(result.error);
      });
    });
    if (removed) {
      await handle.remove();
    } else {
      listenerPromise = Promise.resolve(handle);
    }
  })();

  return () => {
    removed = true;
    void listenerPromise?.then((handle) => handle.remove());
  };
}
