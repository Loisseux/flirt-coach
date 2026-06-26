import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import posthog from "posthog-js";
import { router } from "@/router";
import "@/styles.css";

posthog.init(import.meta.env.VITE_PUBLIC_POSTHOG_PROJECT_TOKEN as string, {
  api_host: "/ingest",
  ui_host: (import.meta.env.VITE_PUBLIC_POSTHOG_HOST as string) || "https://eu.posthog.com",
  defaults: "2026-01-30",
  capture_exceptions: true,
  person_profiles: "identified_only",
  debug: import.meta.env.DEV,
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
