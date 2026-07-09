import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { AppErrorBoundary } from "@/components/AppErrorBoundary";
import { AppErrorFallback } from "@/components/AppErrorFallback";
import { installGlobalErrorHandler, registerAppRoot } from "@/lib/global-error-handler";
import { router } from "@/router";
import "@/styles.css";

installGlobalErrorHandler();

const container = document.getElementById("root");
if (!container) {
  throw new Error("Root element #root not found");
}

try {
  const root = createRoot(container);
  registerAppRoot(root);

  root.render(
    <StrictMode>
      <AppErrorBoundary>
        <RouterProvider router={router} />
      </AppErrorBoundary>
    </StrictMode>,
  );
} catch (error) {
  console.error("[bootstrap]", error);
  const root = createRoot(container);
  registerAppRoot(root);
  root.render(
    <AppErrorFallback
      message={error instanceof Error ? error.message : undefined}
      onRetry={() => window.location.reload()}
    />,
  );
}
