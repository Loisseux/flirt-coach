import { createFileRoute } from "@tanstack/react-router";
import { Paywall } from "@/components/flirtcoach/Paywall";

export const Route = createFileRoute("/paywall")({
  component: PaywallPage,
});

function PaywallPage() {
  return (
    <div className="fc-app-shell mx-auto w-full max-w-[430px]">
      <div className="fc-screen-host fc-screen-panel">
        <Paywall />
      </div>
    </div>
  );
}
