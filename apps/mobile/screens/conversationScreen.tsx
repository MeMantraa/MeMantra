import React, { useState, useEffect, useRef } from 'react';
import { View, FlatList, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import AppText from '../components/UI/textWrapper';
import { ChatBubble } from '../components/chat/ChatBubble';
import ChatInput from '../components/chat/ChatInput';
import { Message, Conversation } from '../types/chat.types';
import { chatService } from '../services/chat.service';
import { storage } from '../utils/storage';

export default function ConversationScreen({ route, navigation }: any) {
  const { conversation } = route.params as { conversation: Conversation };
  const { colors } = useTheme();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<number>(1); // Will be fetched from storage
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    loadMessages();
    loadCurrentUser();

    navigation.setOptions({
      title: conversation.participant_username,
    });
  }, []);

  const loadCurrentUser = async () => {
    try {
      const userData = await storage.getUserData();
      if (userData?.user_id) {
        setCurrentUserId(userData.user_id);
      }
    } catch (err) {
      console.error('Error loading current user:', err);
    }
  };

  const loadMessages = async () => {
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
  };

  const handleSend = async (content: string) => {
    try {
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
    setReplyingTo(message);
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
  };

  const getReplyToMessage = (messageId: number | null | undefined): Message | null => {
    if (!messageId) return null;
    return messages.find((m) => m.message_id === messageId) || null;
  };

  const handleReaction = async (messageId: number, emoji: string) => {
    try {
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
        <View style={styles.centerContainer}>
          <AppText style={{ color: colors.text }}>Loading messages...</AppText>
        </View>
      );
    }

    if (messages.length === 0) {
      return (
        <View style={styles.centerContainer}>
          <AppText style={{ color: colors.text, textAlign: 'center' }}>
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
        contentContainerStyle={styles.messagesList}
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
      style={[styles.container, { backgroundColor: colors.primary }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {renderContent()}

      <ChatInput onSend={handleSend} replyingTo={replyingTo} onCancelReply={handleCancelReply} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  messagesList: {
    paddingVertical: 16,
  },
});
