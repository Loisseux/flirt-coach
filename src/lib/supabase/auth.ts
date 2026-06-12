/** OAuth redirect URL — use deployed app URL on native so Supabase can return the session. */
export function getOAuthRedirectUrl(): string {
  const configured = import.meta.env.VITE_APP_URL?.replace(/\/$/, "");
  return configured || window.location.origin;
}
