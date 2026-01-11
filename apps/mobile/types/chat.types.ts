export interface Message {
  message_id: number;
  conversation_id: number;
  sender_id: number;
  content: string;
  created_at: string;
  read: boolean;
  reply_to_message_id?: number | null;
  reactions?: MessageReaction[];
}

export interface MessageReaction {
  emoji: string;
  count: number;
  users: number[];
}

export interface Conversation {
  conversation_id: number;
  participant_id: number;
  participant_username: string;
  participant_email?: string;
  last_message: string;
  last_message_time: string;
  unread_count: number;
}

export interface CreateMessagePayload {
  conversation_id: number;
  content: string;
  reply_to_message_id?: number;
}

export interface CreateConversationPayload {
  participant_id: number;
}

export interface AddReactionPayload {
  emoji: string;
}
