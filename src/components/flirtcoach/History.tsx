import { useEffect, useMemo, useState } from "react";
import { CHARACTERS, SCENARIOS, type Character, type ScenarioId } from "@/lib/flirtcoach/data";
import { useAuth } from "@/contexts/AuthContext";
import type { ConversationSummary } from "@/lib/supabase/conversations";
import { getConversationsForUser } from "@/lib/supabase/conversations";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString([], { year: "numeric", month: "short", day: "numeric" });
}

function scoreLabel(score: number) {
  // Keep it simple: show 1 decimal if available.
  const rounded = Math.round(score * 10) / 10;
  return `${rounded.toFixed(rounded % 1 === 0 ? 0 : 1)}/10`;
}

export function History({
  onBack,
  onOpenConversation,
}: {
  onBack: () => void;
  onOpenConversation: (conversationId: string) => void;
}) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    void getConversationsForUser(user.id)
      .then((rows) => setConversations(rows))
      .catch((e) => console.error("Failed to load conversations:", e))
      .finally(() => setLoading(false));
  }, [user]);

  const scenariosById = useMemo(() => new Map(SCENARIOS.map((s) => [s.id, s])), []);
  const charsById = useMemo(() => new Map(CHARACTERS.map((c) => [c.id, c])), []);

  return (
    <div className="fc-screen-scroll fc-scroll-bottom-pad flex min-h-0 flex-col px-5 pt-4">
      <header className="mb-5 flex items-center gap-3">
        <button type="button" onClick={onBack} className="text-2xl text-white/80 active:scale-90">
          ←
        </button>
        <h1 className="text-xl font-bold">History</h1>
      </header>

      {loading ? (
        <div className="fc-glass flex-1 rounded-2xl p-6 text-sm text-white/60">Loading…</div>
      ) : conversations.length === 0 ? (
        <div className="mx-auto mt-16 max-w-[280px] text-center text-sm text-white/50">
          No conversations yet. Start one from the home screen.
        </div>
      ) : (
        <div className="space-y-3 pb-2">
          {conversations.map((c) => {
            const char = charsById.get(c.character_id) as Character | undefined;
            const scen = scenariosById.get(c.scenario_id as ScenarioId);
            const initial = char?.name?.[0] ?? "C";
            const label = scen?.label ?? c.scenario_id;
            const score = c.score;

            return (
              <button
                key={c.id}
                type="button"
                onClick={() => onOpenConversation(c.id)}
                className="fc-glass w-full rounded-2xl p-4 text-left active:scale-[0.99]"
              >
                <div className="flex items-start gap-3">
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold"
                    style={{
                      background: `linear-gradient(135deg, ${char?.color ?? "#8B5CF6"}, #8B5CF6)`,
                    }}
                  >
                    {initial}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-white">
                          {char?.name ?? c.character_id}
                        </div>
                        <div className="mt-0.5 text-[11px] text-white/50">{label}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-[11px] text-white/50">{formatDate(c.created_at)}</div>
                        <div className="mt-1 text-sm font-semibold">
                          {typeof score === "number" ? (
                            <span className="text-pink-300">{scoreLabel(score)}</span>
                          ) : (
                            <span className="text-white/40">—</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
