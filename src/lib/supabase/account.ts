import { supabase } from "./client";

/** Delete all messages belonging to the user's conversations. */
async function deleteUserMessages(userId: string): Promise<void> {
  const { data: conversations, error: fetchError } = await supabase
    .from("conversations")
    .select("id")
    .eq("user_id", userId);

  if (fetchError) throw fetchError;

  const conversationIds = (conversations ?? []).map((c) => c.id);
  if (conversationIds.length === 0) return;

  const { error: deleteError } = await supabase
    .from("messages")
    .delete()
    .in("conversation_id", conversationIds);

  if (deleteError) throw deleteError;
}

/** Delete all conversations for the user. */
async function deleteUserConversations(userId: string): Promise<void> {
  const { error } = await supabase.from("conversations").delete().eq("user_id", userId);
  if (error) throw error;
}

/** Remove the signed-in user from Supabase Auth (requires DB function — see schema.sql). */
async function deleteAuthUser(): Promise<void> {
  const { error } = await supabase.rpc("delete_own_account");
  if (error) throw error;
}

/**
 * Permanently delete the user's data and auth account.
 * Order: messages → conversations → auth user.
 */
export async function deleteAccount(userId: string): Promise<void> {
  await deleteUserMessages(userId);
  await deleteUserConversations(userId);
  await deleteAuthUser();
}
