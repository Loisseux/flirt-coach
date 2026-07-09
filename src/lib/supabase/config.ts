/** Public Supabase project URL — safe to bundle in client builds. */
export const DEFAULT_SUPABASE_URL = "https://bdnfxsqixsbrlvfjgkmi.supabase.co";

/** Public Supabase anon key — safe to bundle in client builds. */
export const DEFAULT_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJkbmZ4c3FpeHNicmx2Zmpna21pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk2Mjc3MzUsImV4cCI6MjA5NTIwMzczNX0.RYi-vq7JOv_dgcuqL35SMfNOl5s65ugQr6pHqJ6K3OU";

export function resolveSupabaseUrl(envValue: string | undefined): string {
  const value = envValue?.trim();
  return value || DEFAULT_SUPABASE_URL;
}

export function resolveSupabaseAnonKey(envValue: string | undefined): string {
  const value = envValue?.trim();
  return value || DEFAULT_SUPABASE_ANON_KEY;
}
