import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  DEFAULT_SUPABASE_ANON_KEY,
  DEFAULT_SUPABASE_URL,
  resolveSupabaseAnonKey,
  resolveSupabaseUrl,
} from "./config";

const supabaseUrl = resolveSupabaseUrl(import.meta.env.VITE_SUPABASE_URL as string | undefined);
const supabaseAnonKey = resolveSupabaseAnonKey(
  import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined,
);

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabaseConfigError = isSupabaseConfigured
  ? null
  : "Unable to connect to Quippr servers. Please check your connection and try again.";

let supabaseClient: SupabaseClient;

try {
  supabaseClient = createClient(
    supabaseUrl || DEFAULT_SUPABASE_URL,
    supabaseAnonKey || DEFAULT_SUPABASE_ANON_KEY,
    {
      auth: {
        detectSessionInUrl: true,
        flowType: "pkce",
      },
    },
  );
} catch (error) {
  console.error("Failed to initialize Supabase client:", error);
  supabaseClient = createClient(DEFAULT_SUPABASE_URL, DEFAULT_SUPABASE_ANON_KEY, {
    auth: {
      detectSessionInUrl: true,
      flowType: "pkce",
    },
  });
}

export const supabase = supabaseClient;
