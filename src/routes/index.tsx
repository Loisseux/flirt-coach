import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Onboarding } from "@/components/flirtcoach/Onboarding";
import { Home } from "@/components/flirtcoach/Home";
import { Chat } from "@/components/flirtcoach/Chat";
import { Auth } from "@/components/flirtcoach/Auth";
import { Profile } from "@/components/flirtcoach/Profile";
import { History } from "@/components/flirtcoach/History";
import { HistoryChat } from "@/components/flirtcoach/HistoryChat";
import { Stats } from "@/components/flirtcoach/Stats";
import { useAuth } from "@/contexts/AuthContext";
import { createConversation } from "@/lib/supabase/conversations";
import type { Character, ScenarioId } from "@/lib/flirtcoach/data";

export const Route = createFileRoute("/")({
  component: App,
  ssr: false,
});

type Screen = "onboarding" | "home" | "chat" | "profile" | "history" | "historyChat" | "stats";

function App() {
  const { user, loading: authLoading } = useAuth();
  const [screen, setScreen] = useState<Screen>("home");
  const [character, setCharacter] = useState<Character | null>(null);
  const [scenario, setScenario] = useState<ScenarioId>("neutral");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [historyConversationId, setHistoryConversationId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [startingChat, setStartingChat] = useState(false);

  useEffect(() => {
    const done = localStorage.getItem("fc_onboarded") === "1";
    setScreen(done ? "home" : "onboarding");
    setHydrated(true);
  }, []);

  function finishOnboarding() {
    localStorage.setItem("fc_onboarded", "1");
    setScreen("home");
  }

  async function startChat(c: Character, s: ScenarioId) {
    if (!user) return;
    setStartingChat(true);
    try {
      const id = await createConversation(user.id, c.id, s);
      setCharacter(c);
      setScenario(s);
      setConversationId(id);
      setScreen("chat");
    } catch (e) {
      console.error("Failed to create conversation:", e);
    } finally {
      setStartingChat(false);
    }
  }

  if (!hydrated || authLoading) {
    return <div className="min-h-[100dvh]" style={{ background: "#0D0F1A" }} />;
  }

  if (!user) {
    return (
      <div
        className="mx-auto min-h-[100dvh] w-full max-w-[430px]"
        style={{ background: "#0D0F1A" }}
      >
        <Auth />
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-[100dvh] w-full max-w-[430px]" style={{ background: "#0D0F1A" }}>
      <div key={screen} className="fc-fade transition-opacity duration-200">
        {screen === "onboarding" && <Onboarding onDone={finishOnboarding} />}
        {screen === "home" && (
          <Home
            onStart={(c, s) => void startChat(c, s)}
            onProfile={() => setScreen("profile")}
            onHistory={() => setScreen("history")}
            onStats={() => setScreen("stats")}
          />
        )}
        {screen === "profile" && <Profile onBack={() => setScreen("home")} />}
        {screen === "history" && (
          <History
            onBack={() => setScreen("home")}
            onOpenConversation={(id) => {
              setHistoryConversationId(id);
              setScreen("historyChat");
            }}
          />
        )}
        {screen === "stats" && <Stats onBack={() => setScreen("home")} />}
        {screen === "historyChat" && historyConversationId && (
          <HistoryChat conversationId={historyConversationId} onBack={() => setScreen("history")} />
        )}
        {screen === "chat" && character && conversationId && (
          <Chat
            character={character}
            scenario={scenario}
            conversationId={conversationId}
            onBack={() => {
              setConversationId(null);
              setScreen("home");
            }}
          />
        )}
      </div>
      {startingChat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="fc-glass rounded-2xl px-6 py-4 text-sm text-white/80">Starting chat…</div>
        </div>
      )}
    </div>
  );
}
