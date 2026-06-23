import { useState } from "react";
import { CHARACTERS, SCENARIOS, type Character, type ScenarioId } from "@/lib/flirtcoach/data";
import { FREE_SCENARIO_ID } from "@/lib/revenuecat/premium";

export function Home({
  isPremium,
  conversationCount,
  conversationLimit,
  onStart,
  onProfile,
  onHistory,
  onStats,
  onPremium,
}: {
  isPremium: boolean;
  conversationCount: number;
  conversationLimit: number;
  onStart: (c: Character, s: ScenarioId) => void;
  onProfile: () => void;
  onHistory: () => void;
  onStats: () => void;
  onPremium: () => void;
}) {
  const [charId, setCharId] = useState(CHARACTERS[0].id);
  const [scen, setScen] = useState<ScenarioId>(FREE_SCENARIO_ID);
  const character = CHARACTERS.find((c) => c.id === charId)!;
  const conversationsRemaining = Math.max(0, conversationLimit - conversationCount);
  const atConversationLimit = !isPremium && conversationCount >= conversationLimit;

  function selectScenario(id: ScenarioId) {
    if (!isPremium && id !== FREE_SCENARIO_ID) {
      onPremium();
      return;
    }
    setScen(id);
  }

  function handleStart() {
    if (atConversationLimit) {
      onPremium();
      return;
    }
    onStart(character, scen);
  }

  return (
    <div className="fc-screen-scroll fc-scroll-bottom-pad flex min-h-0 flex-1 flex-col px-5 pt-4">
      <div className="mb-1 flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          <span className="fc-gradient-text">Quippr</span>
        </h1>
        <button
          type="button"
          onClick={onProfile}
          className="fc-glass flex h-10 w-10 items-center justify-center rounded-full text-lg active:scale-90"
          aria-label="Profile"
        >
          👤
        </button>
      </div>
      <p className="mb-7 text-sm text-white/60">Pick someone to chat with.</p>

      {!isPremium && (
        <button
          type="button"
          onClick={onPremium}
          className="fc-glass mb-6 w-full rounded-2xl px-4 py-3 text-left active:scale-[0.99]"
        >
          <div className="text-xs font-semibold uppercase tracking-wider text-pink-400">
            Free plan
          </div>
          <div className="mt-1 text-sm text-white/80">
            {atConversationLimit
              ? "Conversation limit reached — upgrade for unlimited practice."
              : `${conversationsRemaining} of ${conversationLimit} conversations left · Neutral scenario only`}
          </div>
        </button>
      )}

      <div className="mb-8 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={onHistory}
          className="fc-glass rounded-2xl py-3 text-sm font-semibold text-white active:scale-[0.99]"
        >
          🕘 History
        </button>
        <button
          type="button"
          onClick={onStats}
          className="fc-glass rounded-2xl py-3 text-sm font-semibold text-white active:scale-[0.99]"
        >
          📈 Stats
        </button>
      </div>

      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-white/50">
        Characters
      </h2>
      <div className="mb-8 grid grid-cols-2 gap-3">
        {CHARACTERS.map((c) => {
          const active = c.id === charId;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => setCharId(c.id)}
              className={`fc-glass flex w-full flex-col items-center rounded-2xl p-4 text-center transition-all ${active ? "ring-2 ring-pink-500" : "opacity-70"}`}
            >
              <div
                className="mb-3 flex h-16 w-16 items-center justify-center rounded-full text-xl font-bold text-white"
                style={{ background: `linear-gradient(135deg, ${c.color}, #8B5CF6)` }}
              >
                {c.name[0]}
              </div>
              <div className="text-sm font-semibold">
                {c.name}, {c.age}
              </div>
              <div className="mt-1 text-[11px] leading-tight text-white/60">{c.personality}</div>
            </button>
          );
        })}
      </div>

      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-white/50">
        Scenario
      </h2>
      <div className="mb-2 grid grid-cols-5 gap-2">
        {SCENARIOS.map((s) => {
          const active = s.id === scen;
          const locked = !isPremium && s.id !== FREE_SCENARIO_ID;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => selectScenario(s.id)}
              className={`relative fc-glass flex flex-col items-center rounded-xl px-1 py-3 transition-all ${active ? "ring-2 ring-pink-500" : locked ? "opacity-40" : "opacity-60"}`}
            >
              <div className="text-xl">{s.emoji}</div>
              {locked && (
                <span className="absolute -right-1 -top-1 rounded-full bg-black/80 px-1 text-[9px]">
                  🔒
                </span>
              )}
            </button>
          );
        })}
      </div>
      <p className="mb-8 text-center text-xs text-white/60">
        {SCENARIOS.find((s) => s.id === scen)!.label}
      </p>

      <button
        type="button"
        onClick={handleStart}
        className="fc-gradient mt-2 w-full shrink-0 rounded-2xl py-4 text-base font-semibold text-white shadow-lg active:scale-[0.98]"
      >
        {atConversationLimit ? "Upgrade to continue →" : "Start conversation →"}
      </button>
    </div>
  );
}
