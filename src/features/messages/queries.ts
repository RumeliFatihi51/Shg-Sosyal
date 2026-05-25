import "server-only";

import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/session";
import type {
  ConversationDetail,
  ConversationSummary,
  MessageRow,
} from "@/features/messages/types";
import type { PublicUser } from "@/features/users/types";

const messageProfileSelect =
  "id,first_name,last_name,class_name,avatar_path,username,tag,bio";

export async function getConversations(): Promise<{
  profile: PublicUser;
  conversations: ConversationSummary[];
}> {
  const profile = await requireProfile();
  const supabase = await createClient();
  const { data } = await supabase
    .from("direct_conversation_summaries")
    .select("*")
    .eq("user_id", profile.id)
    .order("last_message_at", { ascending: false, nullsFirst: false })
    .limit(50);

  return {
    profile: profile as PublicUser,
    conversations: (data ?? []) as ConversationSummary[],
  };
}

export async function getConversation(
  conversationId: string,
  cursor?: string,
): Promise<{ profile: PublicUser; conversation: ConversationDetail }> {
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data: membership } = await supabase
    .from("conversation_members")
    .select("conversation_id")
    .eq("conversation_id", conversationId)
    .eq("user_id", profile.id)
    .maybeSingle();

  if (!membership) {
    notFound();
  }

  const [{ data: memberRows }, messages] = await Promise.all([
    supabase
      .from("conversation_members")
      .select(`profiles(${messageProfileSelect})`)
      .eq("conversation_id", conversationId)
      .neq("user_id", profile.id)
      .limit(1),
    getConversationMessages(conversationId, cursor),
  ]);

  await supabase
    .from("conversation_members")
    .update({ last_read_at: new Date().toISOString() })
    .eq("conversation_id", conversationId)
    .eq("user_id", profile.id);

  const rawOther = memberRows?.[0]?.profiles as PublicUser | PublicUser[] | null | undefined;
  const otherUser = Array.isArray(rawOther) ? rawOther[0] : rawOther ?? null;

  return {
    profile: profile as PublicUser,
    conversation: {
      id: conversationId,
      otherUser,
      messages,
    },
  };
}

export async function getConversationMessages(conversationId: string, cursor?: string) {
  const supabase = await createClient();
  let request = supabase
    .from("messages")
    .select(`id,conversation_id,sender_id,content,created_at,edited_at,deleted_at,status,sender:profiles!messages_sender_id_fkey(${messageProfileSelect})`)
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false })
    .limit(30);

  if (cursor) {
    request = request.lt("created_at", cursor);
  }

  const { data } = await request;

  return ((data ?? []) as unknown as MessageRow[]).reverse();
}
