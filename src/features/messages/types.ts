import type { PublicUser } from "@/features/users/types";

export type ConversationSummary = {
  conversation_id: string;
  other_user_id: string | null;
  other_first_name: string | null;
  other_last_name: string | null;
  other_avatar_path: string | null;
  other_username: string | null;
  other_tag: string | null;
  last_message_at: string | null;
  last_message_content: string | null;
  last_message_sender_id: string | null;
  unread_count: number;
};

export type MessageRow = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string | null;
  created_at: string;
  edited_at: string | null;
  deleted_at: string | null;
  status: "sent" | "edited" | "deleted";
  sender?: PublicUser | null;
};

export type ConversationDetail = {
  id: string;
  otherUser: PublicUser | null;
  messages: MessageRow[];
};
