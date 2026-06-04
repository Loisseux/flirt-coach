export const GDPR_CONSENT_KEY = "fc_gdpr_consent";

export function hasGdprConsent(): boolean {
  return localStorage.getItem(GDPR_CONSENT_KEY) === "1";
}

export function setGdprConsent(): void {
  localStorage.setItem(GDPR_CONSENT_KEY, "1");
}

export { getPrivacyPolicyUrl, getTermsUrl } from "./legal";
