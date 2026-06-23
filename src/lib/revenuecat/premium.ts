import type { CustomerInfo, PurchasesOffering, PurchasesPackage } from "@revenuecat/purchases-capacitor";
import { PACKAGE_TYPE } from "@revenuecat/purchases-capacitor";
import { PREMIUM_ENTITLEMENT_ID } from "./config";

/** Free tier: only the neutral scenario. */
export const FREE_SCENARIO_ID = "neutral" as const;

/** Free tier: max conversations a user can start. */
export const FREE_CONVERSATION_LIMIT = 3;

/** Free tier: hints per conversation. */
export const FREE_HINTS_PER_CONVERSATION = 1;

/** Free tier: feedback requests per conversation. */
export const FREE_FEEDBACK_PER_CONVERSATION = 1;

export function hasPremiumEntitlement(customerInfo: CustomerInfo | null | undefined): boolean {
  if (!customerInfo) return false;
  return customerInfo.entitlements.active[PREMIUM_ENTITLEMENT_ID]?.isActive === true;
}

export function isMonthlyPackage(pkg: PurchasesPackage): boolean {
  if (pkg.packageType === PACKAGE_TYPE.MONTHLY) return true;
  const id = `${pkg.identifier} ${pkg.product.identifier}`.toLowerCase();
  return id.includes("month") && !id.includes("annual") && !id.includes("year");
}

export function isYearlyPackage(pkg: PurchasesPackage): boolean {
  if (pkg.packageType === PACKAGE_TYPE.ANNUAL) return true;
  const id = `${pkg.identifier} ${pkg.product.identifier}`.toLowerCase();
  return id.includes("annual") || id.includes("year");
}

export function pickSubscriptionPackages(offering: PurchasesOffering | null | undefined) {
  const packages = offering?.availablePackages ?? [];

  let monthly: PurchasesPackage | undefined =
    offering?.monthly ??
    packages.find((p) => p.packageType === PACKAGE_TYPE.MONTHLY) ??
    packages.find((p) => isMonthlyPackage(p) && !isYearlyPackage(p));

  let yearly: PurchasesPackage | undefined =
    offering?.annual ??
    packages.find((p) => p.packageType === PACKAGE_TYPE.ANNUAL) ??
    packages.find((p) => isYearlyPackage(p));

  if (!monthly && packages.length >= 1) {
    monthly = packages.find((p) => p !== yearly) ?? packages[0];
  }
  if (!yearly && packages.length >= 2) {
    yearly = packages.find((p) => p !== monthly) ?? packages[1];
  }

  return { monthly: monthly ?? null, yearly: yearly ?? null };
}

export function resolvePackageForPlan(
  plan: "monthly" | "yearly",
  monthly: PurchasesPackage | null | undefined,
  yearly: PurchasesPackage | null | undefined,
): PurchasesPackage | null {
  if (plan === "yearly") return yearly ?? null;
  return monthly ?? null;
}

export function formatPackagePrice(pkg: PurchasesPackage | null | undefined): string {
  return pkg?.product.priceString ?? "—";
}

export function computeYearlySavingsPercent(
  monthly: PurchasesPackage | null | undefined,
  yearly: PurchasesPackage | null | undefined,
): number | null {
  const monthlyPrice = monthly?.product.price;
  const yearlyPrice = yearly?.product.price;
  if (monthlyPrice == null || yearlyPrice == null || monthlyPrice <= 0) return null;
  const fullYearMonthly = monthlyPrice * 12;
  if (fullYearMonthly <= yearlyPrice) return null;
  return Math.round(((fullYearMonthly - yearlyPrice) / fullYearMonthly) * 100);
}
