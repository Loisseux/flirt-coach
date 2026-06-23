import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { getPrivacyPolicyUrl, getTermsUrl } from "@/lib/legal";
import { joinWaitlist } from "@/lib/supabase/waitlist";

const WAITLIST_BYPASS_CODE = "QUIPPR2025";

export function LandingPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleNotify(e: React.FormEvent) {
    e.preventDefault();

    if (email.trim() === WAITLIST_BYPASS_CODE) {
      void navigate({ to: "/app" });
      return;
    }

    setBusy(true);
    setStatus("idle");

    const result = await joinWaitlist(email);

    if (result.ok) {
      setStatus("success");
      setMessage(result.message);
      setEmail("");
    } else {
      setStatus("error");
      setMessage(result.message);
    }

    setBusy(false);
  }

  return (
    <div className="min-h-[100dvh] bg-[#0D0F1A] text-white">
      <div className="mx-auto flex min-h-[100dvh] max-w-lg flex-col px-6 py-12 sm:py-16">
        <header className="flex flex-col items-center text-center">
          <img
            src="/app-icon.png"
            alt="Quippr"
            width={96}
            height={96}
            className="h-24 w-24 rounded-[22px] shadow-lg shadow-pink-500/20"
          />
          <h1 className="mt-6 text-4xl font-bold tracking-tight">
            <span className="fc-gradient-text">Quippr</span>
          </h1>
          <p className="mt-4 text-xl font-semibold leading-snug text-white/90">
            Practice real conversations with AI before they count
          </p>
          <p className="mt-4 max-w-md text-base leading-relaxed text-white/60">
            Quippr helps you build confidence through realistic chat practice. Pick a scenario, talk
            with AI characters, and get feedback so you're ready when it matters.
          </p>
        </header>

        <main className="mt-10 flex flex-1 flex-col gap-4">
          <StoreButton label="Download on the" store="App Store" icon={<AppleIcon />} />
          <StoreButton label="Get it on" store="Google Play" icon={<PlayIcon />} />

          <div className="fc-glass mt-4 rounded-2xl p-6">
            <h2 className="text-center text-lg font-semibold text-white">Get notified at launch</h2>
            <p className="mt-2 text-center text-sm text-white/50">
              Quippr is coming soon to the App Store and Google Play. Leave your email and we'll let
              you know the moment it's live.
            </p>

            {status === "success" ? (
              <p className="mt-4 text-center text-sm text-emerald-400">{message}</p>
            ) : (
              <form onSubmit={(e) => void handleNotify(e)} noValidate className="mt-5 space-y-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (status === "error") setStatus("idle");
                  }}
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-white/40 focus:border-pink-500/50"
                />
                {status === "error" && (
                  <p className="text-center text-sm text-pink-400">{message}</p>
                )}
                <button
                  type="submit"
                  disabled={busy}
                  className="fc-gradient w-full rounded-xl py-3.5 text-sm font-semibold text-white shadow-lg active:scale-[0.98] disabled:opacity-50"
                >
                  {busy ? "…" : "Notify me"}
                </button>
              </form>
            )}
          </div>
        </main>

        <footer className="mt-10 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-white/40">
          <a href={getPrivacyPolicyUrl()} className="hover:text-white/70">
            Privacy Policy
          </a>
          <span aria-hidden="true">·</span>
          <a href={getTermsUrl()} className="hover:text-white/70">
            Terms of Service
          </a>
        </footer>
      </div>
    </div>
  );
}

function StoreButton({
  label,
  store,
  icon,
}: {
  label: string;
  store: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black">
      <div className="flex items-center gap-3 px-5 py-3.5 opacity-50">
        {icon}
        <div className="text-left leading-tight">
          <div className="text-[10px] uppercase tracking-wide text-white/70">{label}</div>
          <div className="text-lg font-semibold text-white">{store}</div>
        </div>
      </div>
      <div className="absolute inset-0 flex items-center justify-center bg-[#0D0F1A]/70 backdrop-blur-[2px]">
        <span className="rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-white">
          Coming Soon
        </span>
      </div>
    </div>
  );
}

function AppleIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <path d="M3.609 1.814L13.792 12 3.61 22.186a1.003 1.003 0 0 1-1.61-.814V2.628a1.003 1.003 0 0 1 1.61-.814z" />
    </svg>
  );
}
