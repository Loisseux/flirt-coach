import { Capacitor } from "@capacitor/core";
import { Purchases, type CustomerInfo, type PurchasesPackage } from "@revenuecat/purchases-capacitor";
import { getRevenueCatApiKey, isRevenueCatAvailable } from "./config";
import { hasPremiumEntitlement } from "./premium";

let configured = false;
let configurePromise: Promise<void> | null = null;

export async function configureRevenueCat(appUserId?: string): Promise<void> {
  if (!isRevenueCatAvailable()) return;

  const apiKey = getRevenueCatApiKey();
  if (!apiKey) return;

  if (configurePromise) {
    await configurePromise;
  }

  if (configured && !appUserId) return;

  configurePromise = (async () => {
    await Purchases.configure({
      apiKey,
      appUserID: appUserId ?? null,
    });
    configured = true;
    configurePromise = null;
  })();

  return configurePromise;
}

export async function identifyRevenueCatUser(appUserId: string): Promise<void> {
  if (!isRevenueCatAvailable()) return;
  await configureRevenueCat(appUserId);
  await Purchases.logIn({ appUserID: appUserId });
}

export async function getCustomerInfo(): Promise<CustomerInfo | null> {
  if (!isRevenueCatAvailable()) return null;
  await configureRevenueCat();
  const { customerInfo } = await Purchases.getCustomerInfo();
  return customerInfo;
}

export function isPremiumActive(customerInfo: CustomerInfo | null): boolean {
  return hasPremiumEntitlement(customerInfo);
}

export async function fetchOfferings() {
  if (!isRevenueCatAvailable()) return null;
  await configureRevenueCat();
  const offerings = await Purchases.getOfferings();

  const current = offerings.current ?? null;
  const availablePackages = current?.availablePackages ?? [];

  console.log("[RevenueCat] getOfferings", {
    allOfferingIds: Object.keys(offerings.all ?? {}),
    currentOfferingId: current?.identifier ?? null,
    packageCount: availablePackages.length,
    monthly: current?.monthly
      ? {
          identifier: current.monthly.identifier,
          packageType: current.monthly.packageType,
          productId: current.monthly.product.identifier,
          priceString: current.monthly.product.priceString,
        }
      : null,
    annual: current?.annual
      ? {
          identifier: current.annual.identifier,
          packageType: current.annual.packageType,
          productId: current.annual.product.identifier,
          priceString: current.annual.product.priceString,
        }
      : null,
    availablePackages: availablePackages.map((p) => ({
      identifier: p.identifier,
      packageType: p.packageType,
      productId: p.product.identifier,
      priceString: p.product.priceString,
    })),
    fullOfferings: offerings,
    fullCurrentOffering: current,
  });

  return current;
}

export async function purchaseRevenueCatPackage(
  pkg: PurchasesPackage,
): Promise<{ customerInfo: CustomerInfo | null; error: string | null; cancelled: boolean }> {
  if (!isRevenueCatAvailable()) {
    return { customerInfo: null, error: "Purchases are only available in the mobile app.", cancelled: false };
  }

  try {
    await configureRevenueCat();
    const { customerInfo } = await Purchases.purchasePackage({ aPackage: pkg });
    return { customerInfo, error: null, cancelled: false };
  } catch (e) {
    const err = e as { message?: string; userCancelled?: boolean };
    if (err.userCancelled) {
      return { customerInfo: null, error: null, cancelled: true };
    }
    return {
      customerInfo: null,
      error: err.message ?? "Purchase failed. Please try again.",
      cancelled: false,
    };
  }
}

export async function restoreRevenueCatPurchases(): Promise<{
  customerInfo: CustomerInfo | null;
  error: string | null;
}> {
  if (!isRevenueCatAvailable()) {
    return { customerInfo: null, error: "Restore is only available in the mobile app." };
  }

  try {
    await configureRevenueCat();
    const { customerInfo } = await Purchases.restorePurchases();
    return { customerInfo, error: null };
  } catch (e) {
    return { customerInfo: null, error: (e as Error).message };
  }
}

export async function addCustomerInfoListener(
  listener: (info: CustomerInfo) => void,
): Promise<() => void> {
  if (!Capacitor.isNativePlatform()) return () => {};

  await configureRevenueCat();
  const id = await Purchases.addCustomerInfoUpdateListener((info) => listener(info));
  return () => {
    void Purchases.removeCustomerInfoUpdateListener({ listenerToRemove: id });
  };
}
