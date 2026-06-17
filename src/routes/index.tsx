import { createFileRoute, Navigate } from "@tanstack/react-router";
import { Capacitor } from "@capacitor/core";
import { LandingPage } from "@/components/landing/LandingPage";

export const Route = createFileRoute("/")({
  component: IndexPage,
});

function IndexPage() {
  if (Capacitor.isNativePlatform()) {
    return <Navigate to="/app" />;
  }

  return <LandingPage />;
}
