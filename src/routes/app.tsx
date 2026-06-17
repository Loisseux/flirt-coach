import { createFileRoute } from "@tanstack/react-router";
import { QuipprApp } from "@/components/flirtcoach/QuipprApp";

export const Route = createFileRoute("/app")({
  component: QuipprApp,
});
