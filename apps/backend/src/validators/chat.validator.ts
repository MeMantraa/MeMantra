import { z } from 'zod';

// Conversation ID param schema
export const conversationIdSchema = z.object({
  params: z.object({
    id: z.string().transform(Number).pipe(z.number().int().positive('Invalid conversation ID')),
  }),
});

// Create conversation schema
export const createConversationSchema = z.object({
  body: z.object({
    participant_id: z.number().int().positive('Invalid participant ID'),
  }),
});

// Send message schema
export const sendMessageSchema = z.object({
  body: z.object({
    conversation_id: z.number().int().positive('Invalid conversation ID'),
    content: z.string().min(1, 'Message content is required').max(1000, 'Message is too long'),
    reply_to_message_id: z.number().int().positive('Invalid message ID').optional(),
  }),
});

export type CreateConversationInput = z.infer<typeof createConversationSchema>['body'];
export type SendMessageInput = z.infer<typeof sendMessageSchema>['body'];
