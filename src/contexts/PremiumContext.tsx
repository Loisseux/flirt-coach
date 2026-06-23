import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { PurchasesOffering, PurchasesPackage } from "@revenuecat/purchases-capacitor";
import { useAuth } from "@/contexts/AuthContext";
import { isRevenueCatAvailable } from "@/lib/revenuecat/config";
import {
  computeYearlySavingsPercent,
  hasPremiumEntitlement,
  pickSubscriptionPackages,
} from "@/lib/revenuecat/premium";
import {
  addCustomerInfoListener,
  configureRevenueCat,
  fetchOfferings,
  getCustomerInfo,
  identifyRevenueCatUser,
  purchaseRevenueCatPackage,
  restoreRevenueCatPurchases,
} from "@/lib/revenuecat/purchases";

type PremiumContextValue = {
  isPremium: boolean;
  loading: boolean;
  offering: PurchasesOffering | null;
  monthlyPackage: PurchasesPackage | null;
  yearlyPackage: PurchasesPackage | null;
  yearlySavingsPercent: number | null;
  offeringsLoading: boolean;
  offeringsLoaded: boolean;
  hasPackages: boolean;
  refreshPremium: () => Promise<void>;
  loadOfferings: () => Promise<{ monthly: PurchasesPackage | null; yearly: PurchasesPackage | null }>;
  purchasePackage: (pkg: PurchasesPackage) => Promise<{ error: string | null; cancelled: boolean }>;
  restorePurchases: () => Promise<{ error: string | null }>;
};

const PremiumContext = createContext<PremiumContextValue | null>(null);

export function PremiumProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(isRevenueCatAvailable());
  const [offering, setOffering] = useState<PurchasesOffering | null>(null);
  const [offeringsLoading, setOfferingsLoading] = useState(isRevenueCatAvailable());
  const [offeringsLoaded, setOfferingsLoaded] = useState(false);

  const { monthlyPackage, yearlyPackage } = useMemo(
    () => pickSubscriptionPackages(offering),
    [offering],
  );

  const hasPackages = monthlyPackage != null || yearlyPackage != null;

  const yearlySavingsPercent = useMemo(
    () => computeYearlySavingsPercent(monthlyPackage, yearlyPackage),
    [monthlyPackage, yearlyPackage],
  );

  const applyCustomerInfo = useCallback((info: { entitlements: { active: Record<string, { isActive?: boolean }> } } | null) => {
    setIsPremium(hasPremiumEntitlement(info));
  }, []);

  const refreshPremium = useCallback(async () => {
    if (!isRevenueCatAvailable()) {
      setIsPremium(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      if (user?.id) await identifyRevenueCatUser(user.id);
      else await configureRevenueCat();
      const info = await getCustomerInfo();
      applyCustomerInfo(info);
    } catch (e) {
      console.error("Failed to refresh premium status:", e);
    } finally {
      setLoading(false);
    }
  }, [user?.id, applyCustomerInfo]);

  const loadOfferings = useCallback(async () => {
    if (!isRevenueCatAvailable()) {
      setOfferingsLoading(false);
      setOfferingsLoaded(true);
      return { monthly: null, yearly: null };
    }

    setOfferingsLoading(true);
    try {
      // Ensure RevenueCat is configured (and user identified) before fetching offerings.
      if (user?.id) await identifyRevenueCatUser(user.id);
      else await configureRevenueCat();

      const current = await fetchOfferings();
      const picked = pickSubscriptionPackages(current);

      console.log("[RevenueCat] loadOfferings complete", {
        offeringsLoaded: true,
        offeringId: current?.identifier ?? null,
        pickedMonthly: picked.monthly?.identifier ?? null,
        pickedYearly: picked.yearly?.identifier ?? null,
        hasPackages: picked.monthly != null || picked.yearly != null,
      });

      setOffering(current);
      return picked;
    } catch (e) {
      console.error("[RevenueCat] loadOfferings failed:", e);
      return { monthly: null, yearly: null };
    } finally {
      setOfferingsLoading(false);
      setOfferingsLoaded(true);
    }
  }, [user?.id]);

  const purchasePackage = useCallback(
    async (pkg: PurchasesPackage) => {
      const result = await purchaseRevenueCatPackage(pkg);
      if (result.customerInfo) applyCustomerInfo(result.customerInfo);
      return { error: result.error, cancelled: result.cancelled };
    },
    [applyCustomerInfo],
  );

  const restorePurchases = useCallback(async () => {
    const result = await restoreRevenueCatPurchases();
    if (result.customerInfo) applyCustomerInfo(result.customerInfo);
    return { error: result.error };
  }, [applyCustomerInfo]);

  useEffect(() => {
    void refreshPremium();
    void loadOfferings();
  }, [refreshPremium, loadOfferings]);

  useEffect(() => {
    if (!isRevenueCatAvailable()) return;
    let removeListener: (() => void) | undefined;

    void addCustomerInfoListener((info) => applyCustomerInfo(info)).then((remove) => {
      removeListener = remove;
    });

    return () => removeListener?.();
  }, [applyCustomerInfo]);

  const value = useMemo(
    () => ({
      isPremium,
      loading,
      offering,
      monthlyPackage,
      yearlyPackage,
      yearlySavingsPercent,
      offeringsLoading,
      offeringsLoaded,
      hasPackages,
      refreshPremium,
      loadOfferings,
      purchasePackage,
      restorePurchases,
    }),
    [
      isPremium,
      loading,
      offering,
      monthlyPackage,
      yearlyPackage,
      yearlySavingsPercent,
      offeringsLoading,
      offeringsLoaded,
      hasPackages,
      refreshPremium,
      loadOfferings,
      purchasePackage,
      restorePurchases,
    ],
  );

  return <PremiumContext.Provider value={value}>{children}</PremiumContext.Provider>;
}

export function usePremium() {
  const ctx = useContext(PremiumContext);
  if (!ctx) throw new Error("usePremium must be used within PremiumProvider");
  return ctx;
}
