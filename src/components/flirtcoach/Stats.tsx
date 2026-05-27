import { useEffect, useMemo, useState } from "react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from "recharts";
import { SCENARIOS, type ScenarioId } from "@/lib/flirtcoach/data";
import { useAuth } from "@/contexts/AuthContext";
import type { ConversationSummary } from "@/lib/supabase/conversations";
import { getConversationsForUser } from "@/lib/supabase/conversations";

function dayKeyUtc(iso: string) {
  return new Date(iso).toISOString().slice(0, 10);
}

function prevDayUtc(key: string) {
  const d = new Date(`${key}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

function prettyDate(key: string) {
  return new Date(`${key}T00:00:00.000Z`).toLocaleDateString([], {
    month: "short",
    day: "numeric",
  });
}

export function Stats({ onBack }: { onBack: () => void }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);

  const scenariosById = useMemo(() => new Map(SCENARIOS.map((s) => [s.id, s])), []);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    void getConversationsForUser(user.id)
      .then(setConversations)
      .catch((e) => console.error("Failed to load stats:", e))
      .finally(() => setLoading(false));
  }, [user]);

  const stats = useMemo(() => {
    const total = conversations.length;
    const scored = conversations.filter(
      (c) => typeof c.score === "number",
    ) as (ConversationSummary & {
      score: number;
    })[];

    const avgScore =
      scored.length > 0 ? scored.reduce((sum, c) => sum + c.score, 0) / scored.length : null;

    const scenarioCounts = new Map<string, number>();
    for (const c of conversations) {
      scenarioCounts.set(c.scenario_id, (scenarioCounts.get(c.scenario_id) ?? 0) + 1);
    }
    let mostScenario: string | null = null;
    let mostCount = 0;
    for (const [sid, count] of scenarioCounts.entries()) {
      if (count > mostCount) {
        mostCount = count;
        mostScenario = sid;
      }
    }

    const dayKeys = Array.from(new Set(conversations.map((c) => dayKeyUtc(c.created_at)))).sort();
    let streak = 0;
    if (dayKeys.length > 0) {
      // "Current streak": count consecutive days ending on the most recent day with activity.
      let cur = dayKeys[dayKeys.length - 1];
      while (dayKeys.includes(cur)) {
        streak++;
        cur = prevDayUtc(cur);
      }
    }

    const scoredChrono = scored
      .slice()
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    // Build "average over time" as a running average of the last N scored conversations.
    const slice = scoredChrono.slice(-10);
    let runningSum = 0;
    const runningAvg = slice.map((c, idx) => {
      runningSum += c.score;
      const avg = runningSum / (idx + 1);
      return { day: dayKeyUtc(c.created_at), avg };
    });

    return {
      total,
      avgScore,
      mostScenario,
      mostScenarioLabel:
        (mostScenario && scenariosById.get(mostScenario as ScenarioId)?.label) || mostScenario,
      streak,
      runningAvg,
      scoredCount: scored.length,
    };
  }, [conversations, scenariosById]);

  return (
    <div className="flex min-h-[100dvh] flex-col px-5 pb-6 pt-8" style={{ background: "#0D0F1A" }}>
      <header className="mb-5 flex items-center gap-3">
        <button type="button" onClick={onBack} className="text-2xl text-white/80 active:scale-90">
          ←
        </button>
        <h1 className="text-xl font-bold">Stats</h1>
      </header>

      {loading ? (
        <div className="fc-glass flex-1 rounded-2xl p-6 text-sm text-white/60">Loading…</div>
      ) : conversations.length === 0 ? (
        <div className="mx-auto mt-16 max-w-[280px] text-center text-sm text-white/50">
          No practice yet. Start a conversation and open feedback to track your scores.
        </div>
      ) : (
        <div className="flex-1 space-y-3 overflow-y-auto pb-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="fc-glass rounded-2xl p-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-white/50">
                Total chats
              </div>
              <div className="mt-1 text-2xl font-bold">{stats.total}</div>
            </div>

            <div className="fc-glass rounded-2xl p-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-white/50">
                Streak
              </div>
              <div className="mt-1 text-2xl font-bold">{stats.streak}d</div>
            </div>

            <div className="fc-glass rounded-2xl p-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-white/50">
                Most used scenario
              </div>
              <div className="mt-1 text-sm font-semibold text-white">
                {stats.mostScenarioLabel ?? "—"}
              </div>
            </div>

            <div className="fc-glass rounded-2xl p-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-white/50">
                Avg score
              </div>
              <div className="mt-1 text-2xl font-bold">
                {typeof stats.avgScore === "number"
                  ? `${Math.round(stats.avgScore * 10) / 10}`
                  : "—"}
                {typeof stats.avgScore === "number" ? (
                  <span className="text-sm text-white/40">/10</span>
                ) : null}
              </div>
              <div className="mt-1 text-[11px] text-white/50">{stats.scoredCount} scored</div>
            </div>
          </div>

          <div className="fc-glass rounded-2xl p-4">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-sm font-semibold">Average score over time</div>
              <div className="text-[11px] text-white/50">
                Last {Math.min(10, stats.scoredCount)} scored
              </div>
            </div>

            {stats.runningAvg.length === 0 ? (
              <div className="text-sm text-white/50">
                Open feedback in a chat to start tracking scores.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={160}>
                <LineChart
                  data={stats.runningAvg.map((d) => ({ ...d, dayLabel: prettyDate(d.day) }))}
                >
                  <XAxis
                    dataKey="dayLabel"
                    tick={{ fill: "rgba(255,255,255,0.55)", fontSize: 11 }}
                    axisLine={{ stroke: "rgba(255,255,255,0.08)" }}
                    tickLine={{ stroke: "rgba(255,255,255,0.08)" }}
                  />
                  <YAxis
                    domain={[0, 10]}
                    tick={{ fill: "rgba(255,255,255,0.55)", fontSize: 11 }}
                    axisLine={{ stroke: "rgba(255,255,255,0.08)" }}
                    tickLine={{ stroke: "rgba(255,255,255,0.08)" }}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "rgba(19, 22, 42, 0.95)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: 12,
                      color: "white",
                    }}
                    labelStyle={{ color: "white" }}
                    formatter={(value: unknown) => {
                      const num = typeof value === "number" ? value : Number(value);
                      return [Math.round(num * 10) / 10, "Avg"];
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="avg"
                    stroke="#FF2D87"
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
