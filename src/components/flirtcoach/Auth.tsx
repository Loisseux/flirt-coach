import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

type Mode = "signin" | "signup";

export function Auth() {
  const { signIn, signUp, signInWithGoogle } = useAuth();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setBusy(true);

    const result =
      mode === "signin" ? await signIn(email, password) : await signUp(email, password);

    if (result.error) {
      setError(result.error);
    } else if (mode === "signup") {
      setInfo("Check your email to confirm your account, then sign in.");
    }

    setBusy(false);
  }

  async function handleGoogle() {
    setError(null);
    setBusy(true);
    const result = await signInWithGoogle();
    if (result.error) setError(result.error);
    setBusy(false);
  }

  return (
    <div className="fc-screen-scroll fc-scroll-bottom-pad flex min-h-0 flex-col px-6 py-8">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold">
          <span className="fc-gradient-text">FlirtCoach</span>
        </h1>
        <p className="mt-2 text-sm text-white/60">
          {mode === "signin"
            ? "Sign in to save your conversations"
            : "Create an account to get started"}
        </p>
      </div>

      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          required
          autoComplete="email"
          className="fc-glass w-full rounded-2xl px-4 py-3.5 text-sm text-white outline-none placeholder:text-white/40"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          required
          minLength={6}
          autoComplete={mode === "signin" ? "current-password" : "new-password"}
          className="fc-glass w-full rounded-2xl px-4 py-3.5 text-sm text-white outline-none placeholder:text-white/40"
        />

        {error && <p className="text-center text-sm text-pink-400">{error}</p>}
        {info && <p className="text-center text-sm text-emerald-400">{info}</p>}

        <button
          type="submit"
          disabled={busy}
          className="fc-gradient w-full rounded-2xl py-4 text-base font-semibold text-white shadow-lg active:scale-[0.98] disabled:opacity-50"
        >
          {busy ? "…" : mode === "signin" ? "Sign in" : "Sign up"}
        </button>
      </form>

      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-white/10" />
        <span className="text-xs text-white/40">or</span>
        <div className="h-px flex-1 bg-white/10" />
      </div>

      <button
        type="button"
        onClick={() => void handleGoogle()}
        disabled={busy}
        className="fc-glass flex w-full items-center justify-center gap-3 rounded-2xl py-4 text-sm font-semibold text-white active:scale-[0.98] disabled:opacity-50"
      >
        <GoogleIcon />
        Continue with Google
      </button>

      <p className="mt-8 text-center text-sm text-white/60">
        {mode === "signin" ? "Don't have an account?" : "Already have an account?"}{" "}
        <button
          type="button"
          onClick={() => {
            setMode(mode === "signin" ? "signup" : "signin");
            setError(null);
            setInfo(null);
          }}
          className="font-semibold text-pink-400"
        >
          {mode === "signin" ? "Sign up" : "Sign in"}
        </button>
      </p>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c3.348-3.085 3.995-7.613 1.957-11.616z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.997 8.997 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
      />
    </svg>
  );
}
