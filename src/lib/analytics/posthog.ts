import posthog from "posthog-js";

function capture(event: string, properties?: Record<string, unknown>) {
  posthog.capture(event, properties);
}

export function identifyUser(userId: string, properties?: Record<string, unknown>) {
  posthog.identify(userId, properties);
}

export function resetUser() {
  posthog.reset();
}

export function trackConversationStarted(characterName: string, scenario: string) {
  capture("conversation_started", { character_name: characterName, scenario });
}

export function trackHintRequested() {
  capture("hint_requested");
}

export function trackHintUsed(hintType: string) {
  capture("hint_used", { hint_type: hintType });
}

export function trackFeedbackRequested(score: number) {
  capture("feedback_requested", { score });
}

export function trackPaywallViewed() {
  capture("paywall_viewed");
}

export function trackPurchaseAttempted(plan: "monthly" | "yearly") {
  capture("purchase_attempted", { plan });
}

export function trackSubscriptionRestored() {
  capture("subscription_restored");
}

export function trackUserSignedUp() {
  capture("user_signed_up");
}

export function trackUserSignedIn() {
  capture("user_signed_in");
}

export function trackUserSignedOut() {
  capture("user_signed_out");
}

export function trackConversationLimitReached() {
  capture("conversation_limit_reached");
}

export function trackOnboardingCompleted() {
  capture("onboarding_completed");
}

export function trackOnboardingSkipped(slideIndex: number) {
  capture("onboarding_skipped", { slide_index: slideIndex });
}

export function trackWaitlistJoined(email: string) {
  capture("waitlist_joined", { email });
}

export function trackMessageSent(characterName: string, scenario: string, messageLength: number) {
  capture("message_sent", {
    character_name: characterName,
    scenario,
    message_length: messageLength,
  });
}

export function trackGdprAccepted() {
  capture("gdpr_accepted");
}
