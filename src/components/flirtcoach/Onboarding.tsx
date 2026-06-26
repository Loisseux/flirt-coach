import { useState } from "react";
import { trackOnboardingCompleted, trackOnboardingSkipped } from "@/lib/analytics/posthog";

const SLIDES = [
  {
    emoji: "💬",
    title: "Practice makes perfect",
    subtitle: "Train your conversation skills with Quippr in a safe, judgment-free space",
  },
  {
    emoji: "🎯",
    title: "Choose your scenario",
    subtitle: "From cold start to very interested — you decide the challenge",
  },
  {
    emoji: "📊",
    title: "Get real feedback",
    subtitle: "AI scores your conversation and tells you exactly how to improve",
  },
];

export function Onboarding({ onDone }: { onDone: () => void }) {
  const [i, setI] = useState(0);
  const slide = SLIDES[i];
  const last = i === SLIDES.length - 1;

  function handleSkip() {
    trackOnboardingSkipped(i);
    onDone();
  }

  function handleComplete() {
    trackOnboardingCompleted();
    onDone();
  }

  return (
    <div className="fc-screen-scroll fc-scroll-bottom-pad flex min-h-0 flex-col px-6 py-8">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold">
          <span className="fc-gradient-text">Quippr</span>
        </h1>
      </div>

      <div className="flex justify-end">
        <button onClick={handleSkip} className="text-sm text-white/60 hover:text-white">
          Skip
        </button>
      </div>

      <div key={i} className="fc-fade flex flex-1 flex-col items-center justify-center text-center">
        <div className="mb-10 text-[120px] leading-none">{slide.emoji}</div>
        <h1 className="mb-4 text-3xl font-bold leading-tight">
          <span className="fc-gradient-text">{slide.title}</span>
        </h1>
        <p className="max-w-xs text-base text-white/70">{slide.subtitle}</p>
      </div>

      <div className="mb-6 flex justify-center gap-2">
        {SLIDES.map((_, idx) => (
          <div
            key={idx}
            className={`h-2 rounded-full transition-all ${idx === i ? "w-6 fc-gradient" : "w-2 bg-white/20"}`}
          />
        ))}
      </div>

      {last ? (
        <button
          onClick={handleComplete}
          className="fc-gradient w-full rounded-2xl py-4 text-base font-semibold text-white shadow-lg active:scale-[0.98]"
        >
          Let's go →
        </button>
      ) : (
        <button
          onClick={() => setI(i + 1)}
          className="fc-glass w-full rounded-2xl py-4 text-base font-semibold text-white active:scale-[0.98]"
        >
          Next
        </button>
      )}
    </div>
  );
}
