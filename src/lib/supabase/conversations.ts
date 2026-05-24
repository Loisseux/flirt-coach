import { supabase } from "./client";

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
