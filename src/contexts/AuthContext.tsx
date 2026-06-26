import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import {
  identifyUser,
  resetUser,
  trackUserSignedIn,
  trackUserSignedOut,
} from "@/lib/analytics/posthog";
import { supabase } from "@/lib/supabase/client";
import { deleteAccount as deleteAccountData } from "@/lib/supabase/account";
import { registerNativeOAuthListener, signInWithOAuthProvider } from "@/lib/supabase/auth";

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signInWithGoogle: () => Promise<{ error: string | null }>;
  signInWithApple: () => Promise<{ error: string | null }>;
  oauthError: string | null;
  clearOauthError: () => void;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<{ error: string | null }>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [oauthError, setOauthError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setLoading(false);
      if (s?.user?.id) identifyUser(s.user.id);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s);
      setLoading(false);

      if (s?.user?.id) {
        identifyUser(s.user.id);
        if (event === "SIGNED_IN") {
          trackUserSignedIn();
        }
      } else if (event === "SIGNED_OUT") {
        trackUserSignedOut();
        resetUser();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    return registerNativeOAuthListener((message) => setOauthError(message));
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
    return { error: error?.message ?? null };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  }, []);

  const signInWithGoogle = useCallback(async () => {
    setOauthError(null);
    return signInWithOAuthProvider("google");
  }, []);

  const signInWithApple = useCallback(async () => {
    setOauthError(null);
    return signInWithOAuthProvider("apple");
  }, []);

  const clearOauthError = useCallback(() => setOauthError(null), []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const deleteAccount = useCallback(async () => {
    const userId = session?.user?.id;
    if (!userId) return { error: "Not signed in." };

    try {
      await deleteAccountData(userId);
      await supabase.auth.signOut();
      return { error: null };
    } catch (e) {
      return { error: (e as Error).message };
    }
  }, [session?.user?.id]);

  const value = useMemo(
    () => ({
      user: session?.user ?? null,
      session,
      loading,
      signUp,
      signIn,
      signInWithGoogle,
      signInWithApple,
      oauthError,
      clearOauthError,
      signOut,
      deleteAccount,
    }),
    [
      session,
      loading,
      signUp,
      signIn,
      signInWithGoogle,
      signInWithApple,
      oauthError,
      clearOauthError,
      signOut,
      deleteAccount,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
