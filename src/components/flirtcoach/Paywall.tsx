import { useEffect, useState } from "react";
import type { PurchasesPackage } from "@revenuecat/purchases-capacitor";
import { usePremium } from "@/contexts/PremiumContext";
import { formatPackagePrice, resolvePackageForPlan } from "@/lib/revenuecat/premium";
import { isRevenueCatAvailable } from "@/lib/revenuecat/config";

type Plan = "monthly" | "yearly";

const BENEFITS = [
  { icon: "💬", label: "Unlimited conversations" },
  { icon: "🎭", label: "All scenarios unlocked" },
  { icon: "💡", label: "Unlimited hints & feedback" },
  { icon: "🕘", label: "Full conversation history" },
  { icon: "📈", label: "Advanced stats" },
] as const;

export function Paywall({ onBack, onPurchaseSuccess }: { onBack?: () => void; onPurchaseSuccess?: () => void }) {
  const {
    isPremium,
    monthlyPackage,
    yearlyPackage,
    yearlySavingsPercent,
    offeringsLoading,
    offeringsLoaded,
    hasPackages,
    loadOfferings,
    purchasePackage,
    restorePurchases,
  } = usePremium();

  const [plan, setPlan] = useState<Plan>("yearly");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refresh when paywall opens (provider also loads on mount).
  useEffect(() => {
    void loadOfferings();
  }, [loadOfferings]);

  // Default to yearly; fall back if only one package is available from RevenueCat.
  useEffect(() => {
    if (plan === "yearly" && !yearlyPackage && monthlyPackage) {
      setPlan("monthly");
    }
  }, [plan, yearlyPackage, monthlyPackage]);

  useEffect(() => {
    if (isPremium) onPurchaseSuccess?.();
  }, [isPremium, onPurchaseSuccess]);

  const selectedPackage = resolvePackageForPlan(plan, monthlyPackage, yearlyPackage);

  const monthlyPrice = monthlyPackage ? formatPackagePrice(monthlyPackage) : null;
  const yearlyPrice = yearlyPackage ? formatPackagePrice(yearlyPackage) : null;
  const savingsBadge =
    yearlySavingsPercent != null && yearlySavingsPercent > 0
      ? `Save ${yearlySavingsPercent}%`
      : yearlyPackage && monthlyPackage
        ? "Save 48%"
        : undefined;

  async function handleStartTrial() {
    setError(null);

    if (!isRevenueCatAvailable()) {
      setError("Subscriptions are available in the iOS and Android app.");
      return;
    }

    if (offeringsLoading) {
      setError("Plans are still loading. Please try again in a moment.");
      return;
    }

    let pkg: PurchasesPackage | null = selectedPackage;

    if (!pkg) {
      const picked = await loadOfferings();
      pkg = resolvePackageForPlan(plan, picked.monthly, picked.yearly);
    }

    if (!pkg) {
      console.warn("[Paywall] No package for plan after load", {
        plan,
        offeringsLoaded,
        hasPackages,
        monthlyPackage: monthlyPackage?.identifier ?? null,
        yearlyPackage: yearlyPackage?.identifier ?? null,
      });
      setError(
        offeringsLoaded
          ? "Could not load subscription plans. Check your RevenueCat offering configuration."
          : "Plans are still loading. Please try again in a moment.",
      );
      return;
    }

    setBusy(true);
    const result = await purchasePackage(pkg);
    setBusy(false);

    if (result.error) setError(result.error);
  }

  function handleDismiss() {
    onBack?.();
  }

  async function handleRestore() {
    setError(null);
    setBusy(true);
    const result = await restorePurchases();
    setBusy(false);
    if (result.error) setError(result.error);
  }

  const showPricingCards = offeringsLoaded && hasPackages;

  return (
    <div className="fc-screen-scroll fc-scroll-bottom-pad flex min-h-0 flex-col bg-[#0D0F1A] px-5 pt-4">
      <div className="mb-6 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl fc-gradient text-2xl shadow-lg shadow-[#FF2D87]/25">
          ✨
        </div>
        <h1 className="text-2xl font-bold">
          <span className="fc-gradient-text">Quippr Premium</span>
        </h1>
        <p className="mt-2 text-sm text-white/60">
          Unlock everything and practice without limits.
        </p>
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

      {offeringsLoading && (
        <p className="mb-6 text-center text-sm text-white/50">Loading plans…</p>
      )}

      {offeringsLoaded && !hasPackages && (
        <p className="mb-6 text-center text-sm text-pink-400/80">
          Subscription plans unavailable. Check RevenueCat dashboard configuration.
        </p>
      )}

      {showPricingCards && monthlyPrice && yearlyPrice && (
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
      )}

      {error && <p className="mb-3 text-center text-sm text-pink-400">{error}</p>}

      {isPremium ? (
        <p className="text-center text-sm font-medium text-emerald-400">Premium is active on your account.</p>
      ) : (
        <button
          type="button"
          onClick={() => void handleStartTrial()}
          disabled={busy || offeringsLoading || (offeringsLoaded && !hasPackages)}
          className="fc-gradient w-full rounded-2xl py-4 text-base font-semibold text-white shadow-lg shadow-[#FF2D87]/20 active:scale-[0.98] disabled:opacity-50"
        >
          {busy ? "Processing…" : offeringsLoading ? "Loading plans…" : "Start Free Trial"}
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

      {showPricingCards && monthlyPrice && yearlyPrice && (
        <p className="mt-4 text-center text-[11px] leading-relaxed text-white/35">
          Free trial, then {plan === "yearly" ? `${yearlyPrice}/year` : `${monthlyPrice}/month`}. Cancel
          anytime.
        </p>
      )}
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
