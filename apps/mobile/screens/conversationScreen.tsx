import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import AppText from '../components/UI/textWrapper';
import { ChatBubble } from '../components/chat/ChatBubble';
import ChatInput from '../components/chat/ChatInput';
import { Message, Conversation } from '../types/chat.types';
import { chatService } from '../services/chat.service';
import { storage } from '../utils/storage';
import { usePostHogScreen } from '../utils/posthog';
import { posthog } from '../services/posthog';

export default function ConversationScreen({ route, navigation }: any) {
  usePostHogScreen();
  const { conversation } = route.params as { conversation: Conversation };
  const { colors } = useTheme();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<number>(1); // Will be fetched from storage
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const flatListRef = useRef<FlatList>(null);

  const loadCurrentUser = useCallback(async () => {
    try {
      const userData = await storage.getUserData();
      if (userData?.user_id) {
        setCurrentUserId(userData.user_id);
      }
    } catch (err) {
      console.error('Error loading current user:', err);
    }
  }, []);

  const loadMessages = useCallback(async () => {
    try {
      setLoading(true);
      const token = await storage.getToken();
      const data = await chatService.getMessages(
        conversation.conversation_id,
        token || 'mock-token',
      );

      const messagesWithReactions = await Promise.all(
        data.map(async (msg) => {
          try {
            const reactions = await chatService.getReactions(msg.message_id, token || 'mock-token');
            return { ...msg, reactions };
          } catch (err) {
            console.error('Error loading reactions for message:', msg.message_id, err);
            return { ...msg, reactions: [] };
          }
        }),
      );

      setMessages(messagesWithReactions);

      // Mark as read
      await chatService.markAsRead(conversation.conversation_id, token || 'mock-token');
    } catch (err) {
      console.error('Error loading messages:', err);
    } finally {
      setLoading(false);
    }
  }, [conversation.conversation_id]);

  useEffect(() => {
    loadMessages();
    loadCurrentUser();

    navigation.setOptions({
      title: conversation.participant_username,
    });
  }, [conversation.participant_username, navigation, loadMessages, loadCurrentUser]);

  const handleSend = async (content: string) => {
    try {
      posthog.capture('conversation_message_send', {
        conversation_id: conversation.conversation_id,
        is_reply: Boolean(replyingTo?.message_id),
      });
      const token = await storage.getToken();
      const newMessage = await chatService.sendMessage(
        {
          conversation_id: conversation.conversation_id,
          content,
          reply_to_message_id: replyingTo?.message_id,
        },
        token || 'mock-token',
      );

      setMessages((prev) => [...prev, newMessage]);
      setReplyingTo(null); // Clear reply state after sending

      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  const handleSwipeReply = (message: Message) => {
    // Allow replying to any message including shared mantras
    posthog.capture('conversation_reply_started', { message_id: message.message_id });
    setReplyingTo(message);
  };

  const handleCancelReply = () => {
    posthog.capture('conversation_reply_canceled');
    setReplyingTo(null);
  };

  const getReplyToMessage = (messageId: number | null | undefined): Message | null => {
    if (!messageId) return null;
    return messages.find((m) => m.message_id === messageId) || null;
  };

  const handleReaction = async (messageId: number, emoji: string) => {
    try {
      posthog.capture('conversation_reaction_added', { message_id: messageId, emoji });
      const token = await storage.getToken();
      await chatService.addReaction(messageId, emoji, token || 'mock-token');

      const reactions = await chatService.getReactions(messageId, token || 'mock-token');

      setMessages((prevMessages) =>
        prevMessages.map((msg) => (msg.message_id === messageId ? { ...msg, reactions } : msg)),
      );
    } catch (err) {
      console.error('Error handling reaction:', err);
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <View className="flex-1 justify-center items-center px-5">
          <AppText style={{ color: colors.text }}>Loading messages...</AppText>
        </View>
      );
    }

    if (messages.length === 0) {
      return (
        <View className="flex-1 justify-center items-center px-5">
          <AppText style={{ color: colors.text }} className="text-center">
            No messages yet.{'\n'}Start the conversation!
          </AppText>
        </View>
      );
    }

    return (
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.message_id.toString()}
        contentContainerStyle={{ paddingVertical: 16 }}
        renderItem={({ item }) => (
          <ChatBubble
            message={item}
            isOwnMessage={item.sender_id === currentUserId}
            onSwipeReply={handleSwipeReply}
            replyToMessage={getReplyToMessage(item.reply_to_message_id)}
            onReaction={handleReaction}
            currentUserId={currentUserId}
          />
        )}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
        onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
      />
    );
  };

  return (
    <KeyboardAvoidingView
      className="flex-1"
      style={{ backgroundColor: colors.primary }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {renderContent()}

      <ChatInput onSend={handleSend} replyingTo={replyingTo} onCancelReply={handleCancelReply} />
    </KeyboardAvoidingView>
  );
}
