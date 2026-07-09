import { useState } from "react";
import { Capacitor } from "@capacitor/core";
import { getPrivacyPolicyUrl, getTermsUrl, setGdprConsent } from "@/lib/gdpr";
import { openInBrowser } from "@/lib/legal";
import { trackGdprAccepted } from "@/lib/analytics/posthog";

export function GdprConsent({ onAccept }: { onAccept: () => void }) {
  const [declined, setDeclined] = useState(false);

  function handleAccept() {
    setGdprConsent();
    trackGdprAccepted();
    onAccept();
  }

  async function handleDecline() {
    if (Capacitor.isNativePlatform()) {
      try {
        const { App } = await import("@capacitor/app");
        await App.exitApp();
        return;
      } catch {
        // Fall through to declined message if the plugin is unavailable.
      }
    }
    setDeclined(true);
  }

  if (declined) {
    return (
      <div className="fc-screen-scroll fc-scroll-bottom-pad flex min-h-0 flex-col justify-center px-6 py-10 text-center">
        <h1 className="mb-3 text-xl font-bold text-white">Consent required</h1>
        <p className="text-sm leading-relaxed text-white/60">
          Quippr cannot be used without your consent to our data processing. Close this tab or
          restart the app if you change your mind.
        </p>
      </div>
    );
  }

  return (
    <div className="fc-screen-scroll fc-scroll-bottom-pad flex min-h-0 flex-col px-6 py-10">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold">
          <span className="fc-gradient-text">Quippr</span>
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-white/70">
          Practice witty banter with AI characters in a safe, private space — with feedback to help
          you improve.
        </p>
      </div>

      <div className="fc-glass mb-8 space-y-4 rounded-2xl p-5 text-sm leading-relaxed text-white/80">
        <p>
          To provide the service, Quippr collects and stores data linked to your account, including:
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong className="text-white">Email address</strong> — for sign-in and account
            management
          </li>
          <li>
            <strong className="text-white">Conversation data</strong> — messages and practice
            history saved to your account
          </li>
        </ul>
        <p className="text-white/60">
          By continuing, you agree to this processing. Read our policies for full details:
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void openInBrowser(getPrivacyPolicyUrl())}
            className="font-semibold text-pink-400 underline underline-offset-2"
          >
            Privacy Policy
          </button>
          <button
            type="button"
            onClick={() => void openInBrowser(getTermsUrl())}
            className="font-semibold text-pink-400 underline underline-offset-2"
          >
            Terms of Service
          </button>
        </div>
      </div>

      <div className="mt-auto space-y-3">
        <button
          type="button"
          onClick={handleAccept}
          className="fc-gradient w-full rounded-2xl py-4 text-base font-semibold text-white shadow-lg active:scale-[0.98]"
        >
          I agree
        </button>
        <button
          type="button"
          onClick={() => void handleDecline()}
          className="fc-glass w-full rounded-2xl py-4 text-base font-semibold text-white/70 active:scale-[0.98]"
        >
          Decline
        </button>
      </div>
    </div>
  );
}
