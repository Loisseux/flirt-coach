import type { Character } from "./data";
import { SCENARIOS, type ScenarioId } from "./data";

export type ChatMessage = { role: "user" | "assistant"; content: string };

const API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-4-20250514";

function getKey(): string {
  const key = import.meta.env.VITE_ANTHROPIC_API_KEY as string | undefined;
  if (!key) throw new Error("Missing VITE_ANTHROPIC_API_KEY");
  return key;
}

async function callClaude(system: string, messages: ChatMessage[], max_tokens: number): Promise<string> {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": getKey(),
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({ model: MODEL, max_tokens, system, messages }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Claude API error ${res.status}: ${t}`);
  }
  const data = await res.json();
  return data?.content?.[0]?.text ?? "";
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

export async function sendChat(character: Character, scenarioId: ScenarioId, history: ChatMessage[]): Promise<string> {
  return callClaude(chatSystem(character, scenarioId), history, 150);
}

export async function getHints(character: Character, scenarioId: ScenarioId, history: ChatMessage[]): Promise<{ safe: string; bold: string; funny: string }> {
  const system = `Given this conversation history, generate exactly 3 short reply suggestions for the user.
Format your response as JSON: {"safe": "...", "bold": "...", "funny": "..."}
Each suggestion max 15 words. Natural, not generic. Match the conversation tone.
Language: same as the conversation.
You are helping the user reply to ${character.name}.`;
  const raw = await callClaude(system, history.length ? history : [{ role: "user", content: "Start of conversation" }], 300);
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("Bad hints JSON");
  return JSON.parse(match[0]);
}

export async function getFeedback(character: Character, scenarioId: ScenarioId, history: ChatMessage[]): Promise<{ score: number; good: string[]; improve: string[]; vibe: string }> {
  const system = `Analyze this flirting conversation and return a JSON object:
{"score": 7, "good": ["point 1", "point 2"], "improve": ["point 1", "point 2"], "vibe": "Smooth operator 😎"}
Score is out of 10. Be specific, encouraging, and actionable. Max 2 sentences per bullet.
Language: same as the conversation.
The user was chatting with ${character.name} (${SCENARIOS.find((s) => s.id === scenarioId)!.label}).`;
  const raw = await callClaude(system, history.length ? history : [{ role: "user", content: "No messages yet" }], 400);
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("Bad feedback JSON");
  return JSON.parse(match[0]);
}
