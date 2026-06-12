import { useState } from "react";
import { CHARACTERS, SCENARIOS, type Character, type ScenarioId } from "@/lib/flirtcoach/data";

export function Home({
  onStart,
  onProfile,
  onHistory,
  onStats,
}: {
  onStart: (c: Character, s: ScenarioId) => void;
  onProfile: () => void;
  onHistory: () => void;
  onStats: () => void;
}) {
  const [charId, setCharId] = useState(CHARACTERS[0].id);
  const [scen, setScen] = useState<ScenarioId>("neutral");
  const character = CHARACTERS.find((c) => c.id === charId)!;

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
          return (
            <button
              key={s.id}
              onClick={() => setScen(s.id)}
              className={`fc-glass flex flex-col items-center rounded-xl px-1 py-3 transition-all ${active ? "ring-2 ring-pink-500" : "opacity-60"}`}
            >
              <div className="text-xl">{s.emoji}</div>
            </button>
          );
        })}
      </div>
      <p className="mb-8 text-center text-xs text-white/60">
        {SCENARIOS.find((s) => s.id === scen)!.label}
      </p>

      <button
        type="button"
        onClick={() => onStart(character, scen)}
        className="fc-gradient mt-2 w-full shrink-0 rounded-2xl py-4 text-base font-semibold text-white shadow-lg active:scale-[0.98]"
      >
        Start conversation →
      </button>
    </div>
  );
}
