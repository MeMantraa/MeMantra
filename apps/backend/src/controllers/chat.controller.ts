import { Request, Response } from 'express';
import { ConversationModel } from '../models/conversation.model';
import { MessageModel } from '../models/message.model';
import { MessageReactionModel } from '../models/messageReaction.model';
import { UserModel } from '../models/user.model';

export const ChatController = {
  // GET /api/chat/users - Get all users for chat purposes (authenticated users only)
  async getChatUsers(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          status: 'error',
          message: 'Authentication required',
        });
      }

      const users = await UserModel.findAll();
      
      // Remove sensitive data and exclude current user
      const sanitizedUsers = users
        .filter(user => user.user_id !== userId)
        .map(user => ({
          user_id: user.user_id,
          username: user.username,
          email: user.email,
          auth_provider: user.auth_provider,
          created_at: user.created_at,
        }));

      return res.status(200).json({
        status: 'success',
        data: { users: sanitizedUsers },
      });
    } catch (error) {
      console.error('Get chat users error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Error retrieving users',
      });
    }
  },

  // GET /api/chat/conversations - Get all conversations for authenticated user
  async getConversations(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          status: 'error',
          message: 'Authentication required',
        });
      }

      const conversations = await ConversationModel.findByUserId(userId);

      return res.status(200).json({
        status: 'success',
        data: { conversations },
      });
    } catch (error) {
      console.error('Get conversations error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Error retrieving conversations',
      });
    }
  },

  // GET /api/chat/conversations/:id - Get single conversation details
  async getConversationById(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      const conversationId = Number(req.params.id);

      if (!userId) {
        return res.status(401).json({
          status: 'error',
          message: 'Authentication required',
        });
      }

      // Check if user is participant in conversation
      const isParticipant = await ConversationModel.isParticipant(conversationId, userId);

      if (!isParticipant) {
        return res.status(403).json({
          status: 'error',
          message: 'Access denied',
        });
      }

      const conversation = await ConversationModel.findById(conversationId);

      if (!conversation) {
        return res.status(404).json({
          status: 'error',
          message: 'Conversation not found',
        });
      }

      return res.status(200).json({
        status: 'success',
        data: { conversation },
      });
    } catch (error) {
      console.error('Get conversation error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Error retrieving conversation',
      });
    }
  },

  // GET /api/chat/conversations/:id/messages - Get all messages in a conversation
  async getMessages(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      const conversationId = Number(req.params.id);

      if (!userId) {
        return res.status(401).json({
          status: 'error',
          message: 'Authentication required',
        });
      }

      // Check if user is participant in conversation
      const isParticipant = await ConversationModel.isParticipant(conversationId, userId);

      if (!isParticipant) {
        return res.status(403).json({
          status: 'error',
          message: 'Access denied',
        });
      }

      const messages = await MessageModel.findByConversationId(conversationId);

      return res.status(200).json({
        status: 'success',
        data: { messages },
      });
    } catch (error) {
      console.error('Get messages error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Error retrieving messages',
      });
    }
  },

  // POST /api/chat/messages - Send a new message
  async sendMessage(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      const { conversation_id, content, reply_to_message_id } = req.body;

      if (!userId) {
        return res.status(401).json({
          status: 'error',
          message: 'Authentication required',
        });
      }

      if (!conversation_id || !content) {
        return res.status(400).json({
          status: 'error',
          message: 'Conversation ID and content are required',
        });
      }

      // Check if user is participant in conversation
      const isParticipant = await ConversationModel.isParticipant(conversation_id, userId);

      if (!isParticipant) {
        return res.status(403).json({
          status: 'error',
          message: 'Access denied',
        });
      }

      // If replying to a message, verify it exists and belongs to the same conversation
      if (reply_to_message_id) {
        const replyToMessage = await MessageModel.findById(reply_to_message_id);
        
        if (!replyToMessage) {
          return res.status(404).json({
            status: 'error',
            message: 'Message to reply to not found',
          });
        }

        if (replyToMessage.conversation_id !== conversation_id) {
          return res.status(400).json({
            status: 'error',
            message: 'Cannot reply to a message from a different conversation',
          });
        }
      }

      // Create the message
      const message = await MessageModel.create({
        conversation_id,
        sender_id: userId,
        content,
        created_at: new Date().toISOString(),
        read: false,
        reply_to_message_id: reply_to_message_id || null,
      });

      // Update conversation timestamp
      await ConversationModel.updateTimestamp(conversation_id);

      return res.status(201).json({
        status: 'success',
        message: 'Message sent successfully',
        data: { message },
      });
    } catch (error) {
      console.error('Send message error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Error sending message',
      });
    }
  },

  // POST /api/chat/conversations - Create a new conversation
  async createConversation(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      const { participant_id } = req.body;

      if (!userId) {
        return res.status(401).json({
          status: 'error',
          message: 'Authentication required',
        });
      }

      if (!participant_id) {
        return res.status(400).json({
          status: 'error',
          message: 'Participant ID is required',
        });
      }

      if (userId === participant_id) {
        return res.status(400).json({
          status: 'error',
          message: 'Cannot create conversation with yourself',
        });
      }

      // Check if conversation already exists
      const existingConversation = await ConversationModel.findByUsers(userId, participant_id);

      if (existingConversation) {
        return res.status(200).json({
          status: 'success',
          message: 'Conversation already exists',
          data: { conversation: existingConversation },
        });
      }

      // Create new conversation
      const conversation = await ConversationModel.create(userId, participant_id);

      return res.status(201).json({
        status: 'success',
        message: 'Conversation created successfully',
        data: { conversation },
      });
    } catch (error) {
      console.error('Create conversation error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Error creating conversation',
      });
    }
  },

  // PATCH /api/chat/conversations/:id/read - Mark all messages in conversation as read
  async markAsRead(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      const conversationId = Number(req.params.id);

      if (!userId) {
        return res.status(401).json({
          status: 'error',
          message: 'Authentication required',
        });
      }

      // Check if user is participant in conversation
      const isParticipant = await ConversationModel.isParticipant(conversationId, userId);

      if (!isParticipant) {
        return res.status(403).json({
          status: 'error',
          message: 'Access denied',
        });
      }

      await MessageModel.markAsRead(conversationId, userId);

      return res.status(200).json({
        status: 'success',
        message: 'Messages marked as read',
      });
    } catch (error) {
      console.error('Mark as read error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Error marking messages as read',
      });
    }
  },

  // DELETE /api/chat/conversations/:id - Delete a conversation
  async deleteConversation(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      const conversationId = Number(req.params.id);

      if (!userId) {
        return res.status(401).json({
          status: 'error',
          message: 'Authentication required',
        });
      }

      // Check if user is participant in conversation
      const isParticipant = await ConversationModel.isParticipant(conversationId, userId);

      if (!isParticipant) {
        return res.status(403).json({
          status: 'error',
          message: 'Access denied',
        });
      }

      const deleted = await ConversationModel.delete(conversationId);

      if (!deleted) {
        return res.status(404).json({
          status: 'error',
          message: 'Conversation not found',
        });
      }

      return res.status(200).json({
        status: 'success',
        message: 'Conversation deleted successfully',
      });
    } catch (error) {
      console.error('Delete conversation error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Error deleting conversation',
      });
    }
  },

  // POST /api/chat/messages/:id/reactions - Add a reaction to a message
  async addReaction(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      const messageId = Number(req.params.id);
      const { emoji } = req.body;

      if (!userId) {
        return res.status(401).json({
          status: 'error',
          message: 'Authentication required',
        });
      }

      if (!emoji || typeof emoji !== 'string') {
        return res.status(400).json({
          status: 'error',
          message: 'Emoji is required',
        });
      }

      // Verify message exists and get its conversation
      const message = await MessageModel.findById(messageId);

      if (!message) {
        return res.status(404).json({
          status: 'error',
          message: 'Message not found',
        });
      }

      
      const isParticipant = await ConversationModel.isParticipant(message.conversation_id, userId);

      if (!isParticipant) {
        return res.status(403).json({
          status: 'error',
          message: 'Access denied',
        });
      }

      
      const exists = await MessageReactionModel.exists(messageId, userId, emoji);

      if (exists) {
        
        await MessageReactionModel.delete(messageId, userId, emoji);
        return res.status(200).json({
          status: 'success',
          message: 'Reaction removed',
        });
      }

     
      const reaction = await MessageReactionModel.create({
        message_id: messageId,
        user_id: userId,
        emoji,
      });

      return res.status(201).json({
        status: 'success',
        message: 'Reaction added',
        data: { reaction },
      });
    } catch (error) {
      console.error('Add reaction error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Error adding reaction',
      });
    }
  },

  // GET /api/chat/messages/:id/reactions - Get all reactions for a message
  async getReactions(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      const messageId = Number(req.params.id);

      if (!userId) {
        return res.status(401).json({
          status: 'error',
          message: 'Authentication required',
        });
      }

      // Verify message exists and get its conversation
      const message = await MessageModel.findById(messageId);

      if (!message) {
        return res.status(404).json({
          status: 'error',
          message: 'Message not found',
        });
      }

      // Check if user is participant in the conversation
      const isParticipant = await ConversationModel.isParticipant(message.conversation_id, userId);

      if (!isParticipant) {
        return res.status(403).json({
          status: 'error',
          message: 'Access denied',
        });
      }

      const reactions = await MessageReactionModel.getReactionCounts(messageId);

      return res.status(200).json({
        status: 'success',
        data: { reactions },
      });
    } catch (error) {
      console.error('Get reactions error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Error retrieving reactions',
      });
    }
  },
};
