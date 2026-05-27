import { supabase } from "./client";

export type ConversationSummary = {
  id: string;
  character_id: string;
  scenario_id: string;
  created_at: string;
  score: number | null;
  feedback_at: string | null;
};

export async function createConversation(
  userId: string,
  characterId: string,
  scenarioId: string,
): Promise<string> {
  const { data, error } = await supabase
    .from("conversations")
    .insert({ user_id: userId, character_id: characterId, scenario_id: scenarioId })
    .select("id")
    .single();

  if (error) throw error;
  return data.id;
}

export async function saveMessage(
  conversationId: string,
  role: "user" | "assistant",
  content: string,
): Promise<void> {
  const { error: msgError } = await supabase
    .from("messages")
    .insert({ conversation_id: conversationId, role, content });

  if (msgError) throw msgError;

  const { error: convError } = await supabase
    .from("conversations")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", conversationId);

  if (convError) throw convError;
}

export async function saveConversationScore(conversationId: string, score: number) {
  const { error } = await supabase
    .from("conversations")
    .update({
      score,
      feedback_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", conversationId);

  if (error) throw error;
}

export async function getConversationsForUser(userId: string): Promise<ConversationSummary[]> {
  const { data, error } = await supabase
    .from("conversations")
    .select("id, character_id, scenario_id, created_at, score, feedback_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data as ConversationSummary[];
}

export type ConversationMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
};

export async function getMessagesForConversation(conversationId: string) {
  const { data, error } = await supabase
    .from("messages")
    .select("id, role, content, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data as ConversationMessage[];
}
