import { useEffect, useRef, useState } from "react";
import type { Character, ScenarioId } from "@/lib/flirtcoach/data";
import { SCENARIOS } from "@/lib/flirtcoach/data";
import { sendChat, getHints, getFeedback, type ChatMessage } from "@/lib/flirtcoach/claude";
import { saveConversationScore, saveMessage } from "@/lib/supabase/conversations";

function fmtTime(d: Date) {
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

type Msg = ChatMessage & { t: Date };

export function Chat({
  character,
  scenario,
  conversationId,
  onBack,
}: {
  character: Character;
  scenario: ScenarioId;
  conversationId: string;
  onBack: () => void;
}) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [hintsOpen, setHintsOpen] = useState(false);
  const [hints, setHints] = useState<{ safe: string; bold: string; funny: string } | null>(null);
  const [hintsLoading, setHintsLoading] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedback, setFeedback] = useState<{
    score: number;
    good: string[];
    improve: string[];
    vibe: string;
  } | null>(null);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [animatedScore, setAnimatedScore] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef(messages);
  messagesRef.current = messages;

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing]);

  async function persistMessage(role: "user" | "assistant", content: string) {
    try {
      await saveMessage(conversationId, role, content);
    } catch (e) {
      console.error("Failed to save message:", e);
    }
  }

  async function handleSend(textOverride?: string) {
    const text = (textOverride ?? input).trim();
    if (!text || typing) return;
    const userMsg: Msg = { role: "user", content: text, t: new Date() };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setTyping(true);
    void persistMessage("user", text);

    const delay = 1000 + Math.random() * 2000;
    try {
      const [reply] = await Promise.all([
        sendChat(
          character,
          scenario,
          next.map(({ role, content }) => ({ role, content })),
        ),
        new Promise((r) => setTimeout(r, delay)),
      ]);
      const replyText = reply || "...";
      setMessages((m) => [...m, { role: "assistant", content: replyText, t: new Date() }]);
      void persistMessage("assistant", replyText);
    } catch (e) {
      const errText = `⚠️ ${(e as Error).message}`;
      setMessages((m) => [...m, { role: "assistant", content: errText, t: new Date() }]);
      void persistMessage("assistant", errText);
    } finally {
      setTyping(false);
    }
  }

  async function openHints() {
    setHintsOpen(true);
    setHints(null);
    setHintsLoading(true);
    try {
      const history = messagesRef.current.map(({ role, content }) => ({ role, content }));
      const h = await getHints(character, scenario, history);
      setHints(h);
    } catch (e) {
      setHints({ safe: `⚠️ ${(e as Error).message}`, bold: "", funny: "" });
    } finally {
      setHintsLoading(false);
    }
  }

  async function openFeedback() {
    setFeedbackOpen(true);
    setFeedback(null);
    setAnimatedScore(0);
    setFeedbackLoading(true);
    try {
      const f = await getFeedback(
        character,
        scenario,
        messages.map(({ role, content }) => ({ role, content })),
      );
      setFeedback(f);
      // Persist score so the history + stats screens can be computed later.
      void saveConversationScore(conversationId, f.score).catch((e) => {
        console.error("Failed to save conversation score:", e);
      });
      const start = Date.now();
      const dur = 800;
      const tick = () => {
        const p = Math.min(1, (Date.now() - start) / dur);
        setAnimatedScore(Math.round(f.score * p * 10) / 10);
        if (p < 1) requestAnimationFrame(tick);
      };
      tick();
    } catch (e) {
      setFeedback({ score: 0, good: [], improve: [`⚠️ ${(e as Error).message}`], vibe: "" });
    } finally {
      setFeedbackLoading(false);
    }
  }

  function pickHint(text: string) {
    setInput(text);
    setHintsOpen(false);
  }

  const scenarioLabel = SCENARIOS.find((s) => s.id === scenario)!.label;

  return (
    <div className="flex h-[100dvh] flex-col" style={{ background: "#0D0F1A" }}>
      {/* header */}
      <header className="fc-glass flex items-center gap-3 border-b border-white/5 px-4 py-3">
        <button type="button" onClick={onBack} className="text-2xl text-white/80 active:scale-90">
          ←
        </button>
        <div
          className="flex h-10 w-10 items-center justify-center rounded-full text-base font-bold"
          style={{ background: `linear-gradient(135deg, ${character.color}, #8B5CF6)` }}
        >
          {character.name[0]}
        </div>
        <div className="flex-1">
          <div className="text-sm font-semibold">{character.name}</div>
          <div className="text-[11px] text-white/50">{scenarioLabel}</div>
        </div>
        <button
          type="button"
          onClick={openFeedback}
          className="fc-glass flex items-center gap-1 rounded-full px-3 py-2 text-sm active:scale-95"
          aria-label="Feedback"
        >
          📊
        </button>
      </header>

      {/* messages */}
      <div ref={scrollRef} className="flex-1 space-y-2 overflow-y-auto px-4 py-4">
        {messages.length === 0 && (
          <div className="mx-auto mt-10 max-w-[260px] text-center text-sm text-white/40">
            Say hi to {character.name}. Try a casual opener.
          </div>
        )}
        {messages.map((m, i) => (
          <Bubble key={i} msg={m} />
        ))}
        {typing && (
          <div className="flex items-end gap-2">
            <div className="fc-glass flex gap-1 rounded-2xl px-4 py-3">
              <span
                className="fc-dot inline-block h-2 w-2 rounded-full bg-white/60"
                style={{ animationDelay: "0s" }}
              />
              <span
                className="fc-dot inline-block h-2 w-2 rounded-full bg-white/60"
                style={{ animationDelay: "0.15s" }}
              />
              <span
                className="fc-dot inline-block h-2 w-2 rounded-full bg-white/60"
                style={{ animationDelay: "0.3s" }}
              />
            </div>
          </div>
        )}
      </div>

      {/* input — FAB was right-aligned and overlapped the send button; keep hints on the left */}
      <div className="relative z-10 border-t border-white/5 px-4 pb-4 pt-3">
        <form
          className="relative z-10 flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void handleSend();
          }}
        >
          <button
            type="button"
            onClick={openHints}
            className="fc-gradient flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-xl shadow-lg active:scale-90"
            aria-label="Hints"
          >
            💡
          </button>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            className="fc-glass flex-1 rounded-full px-4 py-3 text-sm text-white outline-none placeholder:text-white/40"
            aria-label="Message text"
          />
          <button
            type="submit"
            disabled={!input.trim() || typing}
            className="fc-gradient flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white shadow-lg active:scale-90 disabled:opacity-40"
            aria-label="Send message"
          >
            ➤
          </button>
        </form>
      </div>

      {hintsOpen && (
        <Sheet onClose={() => setHintsOpen(false)} title="Suggested replies">
          {hintsLoading && <div className="py-6 text-center text-sm text-white/60">Thinking…</div>}
          {hints && !hintsLoading && (
            <div className="space-y-2">
              <HintRow label="Safe & playful" color="#34D399" text={hints.safe} onPick={pickHint} />
              <HintRow label="Bold & flirty" color="#FF2D87" text={hints.bold} onPick={pickHint} />
              <HintRow label="Funny & witty" color="#F59E0B" text={hints.funny} onPick={pickHint} />
            </div>
          )}
        </Sheet>
      )}

      {feedbackOpen && (
        <Sheet onClose={() => setFeedbackOpen(false)} title="Conversation feedback">
          {feedbackLoading && (
            <div className="py-6 text-center text-sm text-white/60">Analyzing…</div>
          )}
          {feedback && !feedbackLoading && (
            <div className="space-y-5">
              <div className="text-center">
                <div className="fc-gradient-text text-6xl font-extrabold tabular-nums">
                  {animatedScore.toFixed(1)}
                  <span className="text-2xl text-white/40">/10</span>
                </div>
                {feedback.vibe && (
                  <div className="fc-glass mt-3 inline-block rounded-full px-4 py-1.5 text-sm">
                    {feedback.vibe}
                  </div>
                )}
              </div>
              {feedback.good.length > 0 && (
                <div>
                  <div className="mb-2 text-sm font-semibold text-emerald-400">
                    ✅ What went well
                  </div>
                  <ul className="space-y-1.5 text-sm text-white/80">
                    {feedback.good.map((g, i) => (
                      <li key={i}>• {g}</li>
                    ))}
                  </ul>
                </div>
              )}
              {feedback.improve.length > 0 && (
                <div>
                  <div className="mb-2 text-sm font-semibold text-pink-400">💡 Improve this</div>
                  <ul className="space-y-1.5 text-sm text-white/80">
                    {feedback.improve.map((g, i) => (
                      <li key={i}>• {g}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </Sheet>
      )}
    </div>
  );
}

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

function HintRow({
  label,
  color,
  text,
  onPick,
}: {
  label: string;
  color: string;
  text: string;
  onPick: (t: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => text && onPick(text)}
      className="fc-glass flex w-full flex-col items-start gap-1 rounded-2xl p-4 text-left active:scale-[0.99]"
    >
      <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color }}>
        {label}
      </span>
      <span className="text-sm text-white/90">{text}</span>
    </button>
  );
}

function Sheet({
  children,
  onClose,
  title,
}: {
  children: React.ReactNode;
  onClose: () => void;
  title: string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60" onClick={onClose}>
      <div
        className="fc-sheet w-full max-w-[430px] rounded-t-3xl border-t border-white/10 bg-[#13162a] p-5 pb-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/20" />
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-semibold">{title}</h3>
          <button type="button" onClick={onClose} className="text-white/60 active:scale-90">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
