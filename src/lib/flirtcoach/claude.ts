import type { Character } from "./data";
import { SCENARIOS, type ScenarioId } from "./data";

export type ChatMessage = { role: "user" | "assistant"; content: string };

const API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-4-20250514";

function getKey(): string {
  const rawUnknown = import.meta.env.VITE_ANTHROPIC_API_KEY;
  const typeofKey = typeof rawUnknown;
  const valueProbe =
    typeofKey === "string"
      ? rawUnknown.length > 0
        ? rawUnknown.slice(0, 10)
        : "(empty string)"
      : String(rawUnknown);

  console.log("[Claude] getKey — VITE_ANTHROPIC_API_KEY", {
    typeofKey,
    valueFirst10OrRepr: valueProbe,
    importMetaEnvKeys: Object.keys(import.meta.env).sort(),
  });

  const raw = rawUnknown as string | undefined;
  const key = typeof raw === "string" ? raw.trim() : "";
  if (!key) throw new Error("Missing VITE_ANTHROPIC_API_KEY");
  return key;
}

async function callClaude(
  system: string,
  messages: ChatMessage[],
  max_tokens: number,
  options?: { logFullResponse?: boolean; logRequestBody?: boolean },
): Promise<string> {
  console.log("[Claude] request start", { max_tokens, messageCount: messages.length });

  const requestBody = { model: MODEL, max_tokens, system, messages };
  if (options?.logRequestBody) {
    console.log("[Claude] API request body", requestBody);
  }

  const apiKey = getKey();
  console.log("[Claude] before fetch", {
    apiKeyPrefix: apiKey.slice(0, 10),
  });

  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify(requestBody),
  });

  console.log("[Claude] after fetch", {
    status: res.status,
    statusText: res.statusText,
    ok: res.ok,
  });

  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Claude API error ${res.status}: ${t}`);
  }
  const data = await res.json();
  if (options?.logFullResponse) {
    console.log("[Claude] full API response", data);
  }
  return data?.content?.[0]?.text ?? "";
}

/** Minimal API call to check whether empty hints responses are due to conversation content vs API/filtering. */
export async function testHintsApiMinimal(): Promise<void> {
  console.log("[Claude] hints filter test — starting minimal request");
  try {
    const text = await callClaude(
      'Respond with this exact JSON: {"safe": "hello", "bold": "hey there", "funny": "yo!"}',
      [{ role: "user", content: "give me the json" }],
      100,
      { logRequestBody: true, logFullResponse: true },
    );
    console.log("[Claude] hints filter test — extracted text", text);
  } catch (e) {
    console.error("[Claude] hints filter test — error", e);
  }
}

function chatSystem(character: Character, scenarioId: ScenarioId): string {
  const s = SCENARIOS.find((x) => x.id === scenarioId)!;
  return `You are ${character.name}, ${character.age} years old, ${character.personality}. Your interests include ${character.interests.join(", ")}.
You are chatting on a dating app with someone you just matched with.
Your interest level is: ${s.description}
Respond ONLY as ${character.name}. Be extremely realistic and human-like.
Use casual language, short messages (1-3 sentences max), occasional emojis.
Never mention being an AI. Stay in character at all times.
Write in the same language as the user (French or English).`;
}

export async function sendChat(
  character: Character,
  scenarioId: ScenarioId,
  history: ChatMessage[],
): Promise<string> {
  return callClaude(chatSystem(character, scenarioId), history, 150);
}

function formatConversationTranscript(history: ChatMessage[], partnerName: string): string {
  const lines = history.filter((m) => m.content?.trim());
  if (lines.length === 0) return "(no messages yet)";
  return lines
    .map((m) => `${m.role === "user" ? "User" : partnerName}: ${m.content.trim()}`)
    .join("\n");
}

export async function getHints(
  character: Character,
  _scenarioId: ScenarioId,
  history: ChatMessage[],
): Promise<{ safe: string; bold: string; funny: string }> {
  const transcript = formatConversationTranscript(history, character.name);

  const system = `You are a conversation helper. Given this chat history, suggest 3 short replies for the user. Respond ONLY with valid JSON: {"safe": "...", "bold": "...", "funny": "..."}

${transcript}`;

  const apiMessages: ChatMessage[] = [{ role: "user", content: "give me the json" }];

  console.log("[Claude] hints context", {
    historyCount: history.length,
    transcriptPreview: transcript.slice(0, 200),
  });

  const raw = await callClaude(system, apiMessages, 500, {
    logRequestBody: true,
    logFullResponse: true,
  });
  console.log("[Claude] hints raw response text", raw);

  const cleaned = raw
    .replace(/```json\n?/gi, "")
    .replace(/```\n?/g, "")
    .trim();
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("Bad hints JSON");
  return JSON.parse(match[0]);
}

export async function getFeedback(
  character: Character,
  _scenarioId: ScenarioId,
  history: ChatMessage[],
): Promise<{ score: number; good: string[]; improve: string[]; vibe: string }> {
  const transcript = formatConversationTranscript(history, character.name);

  const system = `You are a conversation coach. Analyze this chat and respond ONLY with valid JSON: {"score": 7, "good": ["point 1", "point 2"], "improve": ["point 1", "point 2"], "vibe": "Smooth operator 😎"}

${transcript}`;

  const apiMessages: ChatMessage[] = [{ role: "user", content: "give me the json" }];

  const raw = await callClaude(system, apiMessages, 500);
  const cleaned = raw
    .replace(/```json\n?/gi, "")
    .replace(/```\n?/g, "")
    .trim();
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("Bad feedback JSON");
  return JSON.parse(match[0]);
}
