import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Onboarding } from "@/components/flirtcoach/Onboarding";
import { Home } from "@/components/flirtcoach/Home";
import { Chat } from "@/components/flirtcoach/Chat";
import type { Character, ScenarioId } from "@/lib/flirtcoach/data";

export const Route = createFileRoute("/")({
  component: App,
  ssr: false,
});

type Screen = "onboarding" | "home" | "chat";

function App() {
  const [screen, setScreen] = useState<Screen>("home");
  const [character, setCharacter] = useState<Character | null>(null);
  const [scenario, setScenario] = useState<ScenarioId>("neutral");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const done = localStorage.getItem("fc_onboarded") === "1";
    setScreen(done ? "home" : "onboarding");
    setHydrated(true);
  }, []);

  function finishOnboarding() {
    localStorage.setItem("fc_onboarded", "1");
    setScreen("home");
  }

  function startChat(c: Character, s: ScenarioId) {
    setCharacter(c);
    setScenario(s);
    setScreen("chat");
  }

  if (!hydrated) {
    return <div className="min-h-[100dvh]" style={{ background: "#0D0F1A" }} />;
  }

  return (
    <div className="mx-auto min-h-[100dvh] w-full max-w-[430px]" style={{ background: "#0D0F1A" }}>
      {screen === "onboarding" && <Onboarding onDone={finishOnboarding} />}
      {screen === "home" && <Home onStart={startChat} />}
      {screen === "chat" && character && (
        <Chat character={character} scenario={scenario} onBack={() => setScreen("home")} />
      )}
    </div>
  );
}
