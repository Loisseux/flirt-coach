import { createRoot, type Root } from "react-dom/client";
import { AppErrorFallback } from "@/components/AppErrorFallback";

let appRoot: Root | null = null;
let fatalShown = false;

export function registerAppRoot(root: Root) {
  appRoot = root;
}

export function showFatalError(message?: string) {
  if (fatalShown) return;
  fatalShown = true;

  const container = document.getElementById("root");
  if (!container) return;

  try {
    appRoot?.unmount();
  } catch {
    // Root may already be broken.
  }

  appRoot = createRoot(container);
  appRoot.render(
    <AppErrorFallback
      message={message}
      onRetry={() => {
        fatalShown = false;
        window.location.reload();
      }}
    />,
  );
}

function formatError(reason: unknown): string | undefined {
  if (reason instanceof Error) return reason.message;
  if (typeof reason === "string") return reason;
  return undefined;
}

export function installGlobalErrorHandler() {
  window.addEventListener("error", (event) => {
    console.error("[global error]", event.error ?? event.message);
    showFatalError(formatError(event.error ?? event.message));
  });

  window.addEventListener("unhandledrejection", (event) => {
    console.error("[unhandled rejection]", event.reason);
    showFatalError(formatError(event.reason));
  });
}
