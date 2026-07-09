import { useEffect, useState } from "react";
import type { PurchasesPackage } from "@revenuecat/purchases-capacitor";
import { usePremium } from "@/contexts/PremiumContext";
import {
  trackPaywallViewed,
  trackPurchaseAttempted,
  trackSubscriptionRestored,
} from "@/lib/analytics/posthog";
import { formatPackagePrice, resolvePackageForPlan } from "@/lib/revenuecat/premium";
import { isRevenueCatAvailable } from "@/lib/revenuecat/config";
import { APPLE_SUBSCRIPTION_TERMS_URL, getPrivacyPolicyUrl, openInBrowser } from "@/lib/legal";

type Plan = "monthly" | "yearly";

const BENEFITS = [
  { icon: "💬", label: "Unlimited conversations" },
  { icon: "🎭", label: "All scenarios unlocked" },
  { icon: "💡", label: "Unlimited hints & feedback" },
  { icon: "🕘", label: "Full conversation history" },
  { icon: "📈", label: "Advanced stats" },
] as const;

const FALLBACK_PRICES = { monthly: "$7.99", yearly: "$49.99" };

export function Paywall({
  onBack,
  onPurchaseSuccess,
}: {
  onBack?: () => void;
  onPurchaseSuccess?: () => void;
}) {
  const {
    isPremium,
    monthlyPackage,
    yearlyPackage,
    yearlySavingsPercent,
    loadOfferings,
    purchasePackage,
    restorePurchases,
  } = usePremium();

  const [plan, setPlan] = useState<Plan>("yearly");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    trackPaywallViewed();
    void loadOfferings();
  }, [loadOfferings]);

  useEffect(() => {
    if (isPremium) onPurchaseSuccess?.();
  }, [isPremium, onPurchaseSuccess]);

  const monthlyPrice = monthlyPackage
    ? formatPackagePrice(monthlyPackage)
    : FALLBACK_PRICES.monthly;
  const yearlyPrice = yearlyPackage ? formatPackagePrice(yearlyPackage) : FALLBACK_PRICES.yearly;
  const savingsBadge =
    yearlySavingsPercent != null && yearlySavingsPercent > 0
      ? `Save ${yearlySavingsPercent}%`
      : "Save 48%";

  async function resolvePackage(): Promise<PurchasesPackage | null> {
    const pkg = resolvePackageForPlan(plan, monthlyPackage, yearlyPackage);
    if (pkg) return pkg;

    const picked = await loadOfferings();
    return resolvePackageForPlan(plan, picked.monthly, picked.yearly);
  }

  async function handleStartTrial() {
    setError(null);
    trackPurchaseAttempted(plan);

    if (!isRevenueCatAvailable()) {
      setError("Subscriptions are available in the iOS and Android app.");
      return;
    }

    setBusy(true);
    try {
      const pkg = await resolvePackage();
      if (!pkg) {
        setError("Purchase could not be completed. Please try again.");
        return;
      }

      const result = await purchasePackage(pkg);
      if (result.error) setError(result.error);
    } finally {
      setBusy(false);
    }
  }

  function handleDismiss() {
    onBack?.();
  }

  async function handleRestore() {
    setError(null);
    setBusy(true);
    const result = await restorePurchases();
    setBusy(false);
    if (result.error) {
      setError(result.error);
    } else {
      trackSubscriptionRestored();
    }
  }

  return (
    <div className="fc-screen-scroll fc-scroll-bottom-pad flex min-h-0 flex-col bg-[#0D0F1A] px-5 pt-4">
      <div className="mb-6 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl fc-gradient text-2xl shadow-lg shadow-[#FF2D87]/25">
          ✨
        </div>
        <h1 className="text-2xl font-bold">
          <span className="fc-gradient-text">Quippr Premium</span>
        </h1>
        <p className="mt-2 text-sm text-white/60">Unlock everything and practice without limits.</p>
      </div>

      <ul className="mb-8 space-y-2.5">
        {BENEFITS.map(({ icon, label }) => (
          <li
            key={label}
            className="fc-glass flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-white"
          >
            <span className="text-base" aria-hidden="true">
              {icon}
            </span>
            {label}
          </li>
        ))}
      </ul>

      <div className="mb-6 grid grid-cols-2 gap-3">
        <PricingCard
          title="Monthly"
          price={monthlyPrice}
          period="/mo"
          selected={plan === "monthly"}
          onSelect={() => setPlan("monthly")}
        />
        <PricingCard
          title="Yearly"
          price={yearlyPrice}
          period="/yr"
          badge={savingsBadge}
          selected={plan === "yearly"}
          onSelect={() => setPlan("yearly")}
        />
      </div>

      {error && <p className="mb-3 text-center text-sm text-pink-400">{error}</p>}

      {isPremium ? (
        <p className="text-center text-sm font-medium text-emerald-400">
          Premium is active on your account.
        </p>
      ) : (
        <button
          type="button"
          onClick={() => void handleStartTrial()}
          disabled={busy}
          className="fc-gradient w-full rounded-2xl py-4 text-base font-semibold text-white shadow-lg shadow-[#FF2D87]/20 active:scale-[0.98] disabled:opacity-50"
        >
          {busy ? "Processing…" : "Start Free Trial"}
        </button>
      )}

      <button
        type="button"
        onClick={handleDismiss}
        className="mt-4 py-2 text-center text-sm font-medium text-white/50 active:text-white/70"
      >
        Maybe later
      </button>

      {isRevenueCatAvailable() && (
        <button
          type="button"
          onClick={() => void handleRestore()}
          disabled={busy}
          className="mt-1 py-2 text-center text-xs text-white/35 active:text-white/55 disabled:opacity-50"
        >
          Restore purchases
        </button>
      )}

      <div className="mt-2 flex items-center justify-center gap-2 text-xs">
        <button
          type="button"
          onClick={() => void openInBrowser(APPLE_SUBSCRIPTION_TERMS_URL)}
          className="text-white/35 underline-offset-2 active:text-white/55"
        >
          Terms of Use
        </button>
        <span className="text-white/20" aria-hidden="true">
          ·
        </span>
        <button
          type="button"
          onClick={() => void openInBrowser(getPrivacyPolicyUrl())}
          className="text-white/35 underline-offset-2 active:text-white/55"
        >
          Privacy Policy
        </button>
      </div>

      <p className="mt-4 text-center text-[11px] leading-relaxed text-white/35">
        Free trial, then {plan === "yearly" ? `${yearlyPrice}/year` : `${monthlyPrice}/month`}.
        Cancel anytime.
      </p>
    </div>
  );
}

function PricingCard({
  title,
  price,
  period,
  badge,
  selected,
  onSelect,
}: {
  title: string;
  price: string;
  period: string;
  badge?: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`relative flex flex-col rounded-2xl p-3.5 text-left transition-all active:scale-[0.98] ${
        selected
          ? "border-2 border-[#FF2D87]/60 bg-[#FF2D87]/10 shadow-lg shadow-[#8B5CF6]/10"
          : "fc-glass border-2 border-white/8"
      }`}
    >
      {badge && (
        <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full fc-gradient px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
          {badge}
        </span>
      )}
      <div className="text-xs font-semibold text-white/80">{title}</div>
      <div className="mt-2 flex flex-col">
        <span className="text-xl font-bold leading-none text-white">{price}</span>
        <span className="mt-1 text-[11px] text-white/45">{period}</span>
      </div>
      <div
        className={`mt-3 flex h-5 w-5 items-center justify-center self-end rounded-full border-2 ${
          selected ? "border-[#FF2D87] fc-gradient" : "border-white/20"
        }`}
      >
        {selected && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
      </div>
    </button>
  );
}
