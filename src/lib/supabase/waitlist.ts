import { supabase } from "./client";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidWaitlistEmail(email: string): boolean {
  return EMAIL_PATTERN.test(email.trim().toLowerCase());
}

export type JoinWaitlistResult =
  | { ok: true; message: string }
  | { ok: false; message: string };

/**
 * Add an email to the launch waitlist.
 * Duplicate emails are treated as success.
 */
export async function joinWaitlist(email: string): Promise<JoinWaitlistResult> {
  const normalized = email.trim().toLowerCase();

  if (!isValidWaitlistEmail(normalized)) {
    return { ok: false, message: "Please enter a valid email address." };
  }

  const { error } = await supabase.from("waitlist").insert({ email: normalized });

  if (!error) {
    return {
      ok: true,
      message: "You're on the list! We'll email you when Quippr launches.",
    };
  }

  // Postgres unique violation — already signed up
  if (error.code === "23505") {
    return {
      ok: true,
      message: "You're already on the list! We'll email you when Quippr launches.",
    };
  }

  return {
    ok: false,
    message: error.message || "Something went wrong. Please try again.",
  };
}
