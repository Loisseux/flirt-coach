import { useEffect, useMemo, useState } from "react";
import { CHARACTERS, SCENARIOS, type Character, type ScenarioId } from "@/lib/flirtcoach/data";
import { useAuth } from "@/contexts/AuthContext";
import type { ConversationMessage } from "@/lib/supabase/conversations";
import { getConversationsForUser, getMessagesForConversation } from "@/lib/supabase/conversations";

function fmtTime(d: Date) {
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

type Msg = ConversationMessage & { t: Date };

function Bubble({ msg }: { msg: Msg }) {
  const isUser = msg.role === "user";
  return (
    <div className={`fc-fade flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className="max-w-[78%]">
        <div
          className={`rounded-2xl px-4 py-2.5 text-sm leading-snug shadow ${
            isUser ? "fc-gradient rounded-br-md text-white" : "fc-glass rounded-bl-md text-white"
          }`}
        >
          {msg.content}
        </div>
        <div className={`mt-1 text-[10px] text-white/40 ${isUser ? "text-right" : "text-left"}`}>
          {fmtTime(msg.t)}
        </div>
      </div>
    </div>
  );
}

export function HistoryChat({
  conversationId,
  onBack,
}: {
  conversationId: string;
  onBack: () => void;
}) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [character, setCharacter] = useState<Character | null>(null);
  const [scenarioLabel, setScenarioLabel] = useState<string>("");
  const [score, setScore] = useState<number | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);

  const scenariosById = useMemo(() => new Map(SCENARIOS.map((s) => [s.id, s])), []);
  const charsById = useMemo(() => new Map(CHARACTERS.map((c) => [c.id, c])), []);

  useEffect(() => {
    if (!user) return;
    setLoading(true);

    (async () => {
      // We already have a compact conversation list helper; reuse it to get metadata
      // without adding a new "get by id" RPC.
      const convs = await getConversationsForUser(user.id);
      const conv = convs.find((c) => c.id === conversationId);
      if (!conv) throw new Error("Conversation not found (or not owned by user).");

      const char = charsById.get(conv.character_id);
      const scen = scenariosById.get(conv.scenario_id as ScenarioId);

      setCharacter(char ?? null);
      setScenarioLabel(scen?.label ?? conv.scenario_id);
      setScore(conv.score ?? null);

      const rows = await getMessagesForConversation(conversationId);
      setMessages(rows.map((m) => ({ ...m, t: new Date(m.created_at) })));
    })()
      .catch((e) => console.error("Failed to load history chat:", e))
      .finally(() => setLoading(false));
  }, [conversationId, user, charsById, scenariosById]);

  return (
    <div className="fc-screen-fill">
      <header className="fc-glass flex items-center gap-3 border-b border-white/5 px-4 py-3">
        <button type="button" onClick={onBack} className="text-2xl text-white/80 active:scale-90">
          ←
        </button>

        <div
          className="flex h-10 w-10 items-center justify-center rounded-full text-base font-bold"
          style={{
            background: `linear-gradient(135deg, ${character?.color ?? "#8B5CF6"}, #8B5CF6)`,
          }}
        >
          {(character?.name?.[0] ?? "C") as string}
        </div>

        <div className="flex-1">
          <div className="text-sm font-semibold">{character?.name ?? "Conversation"}</div>
          <div className="text-[11px] text-white/50">{scenarioLabel}</div>
        </div>

        {typeof score === "number" ? (
          <div className="text-sm font-semibold text-pink-300">
            {Math.round(score * 10) / 10}/10
          </div>
        ) : (
          <div className="text-sm font-semibold text-white/40">—</div>
        )}
      </header>

      {loading ? (
        <div className="flex-1 overflow-y-auto px-4 py-6 text-center text-sm text-white/60">
          Loading…
        </div>
      ) : messages.length === 0 ? (
        <div className="mx-auto mt-16 max-w-[260px] text-center text-sm text-white/40">
          No messages in this conversation.
        </div>
      ) : (
        <div className="flex-1 space-y-2 overflow-y-auto px-4 py-4">
          {messages.map((m, i) => (
            <Bubble key={i} msg={m} />
          ))}
        </div>
      )}
    </div>
  );
}
