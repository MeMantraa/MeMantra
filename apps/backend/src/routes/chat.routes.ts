import { Router } from 'express';
import { ChatController } from '../controllers/chat.controller';
import { validateRequest } from '../middleware/validate.middleware';
import { authenticate } from '../middleware/auth.middleware';
import {
  conversationIdSchema,
  createConversationSchema,
  sendMessageSchema,
} from '../validators/chat.validator';

const router = Router();

// All chat routes require authentication
router.use(authenticate);

// Get users for chat (non-admin endpoint)
router.get('/users', ChatController.getChatUsers);

// Conversation routes
router.get('/conversations', ChatController.getConversations);

router.get(
  '/conversations/:id',
  validateRequest(conversationIdSchema),
  ChatController.getConversationById,
);

router.get(
  '/conversations/:id/messages',
  validateRequest(conversationIdSchema),
  ChatController.getMessages,
);

router.post(
  '/conversations',
  validateRequest(createConversationSchema),
  ChatController.createConversation,
);

router.patch(
  '/conversations/:id/read',
  validateRequest(conversationIdSchema),
  ChatController.markAsRead,
);

router.delete(
  '/conversations/:id',
  validateRequest(conversationIdSchema),
  ChatController.deleteConversation,
);

// Message routes
router.post('/messages', validateRequest(sendMessageSchema), ChatController.sendMessage);

// Message reaction routes
router.post('/messages/:id/reactions', ChatController.addReaction);
router.get('/messages/:id/reactions', ChatController.getReactions);

export default router;
