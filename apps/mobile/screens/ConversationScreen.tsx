import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  FlatList,
  KeyboardAvoidingView,
  TouchableOpacity,
  Alert,
  Modal,
  Pressable,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import AppText from '../components/UI/textWrapper';
import { ChatBubble } from '../components/chat/ChatBubble';
import ChatInput from '../components/chat/ChatInput';
import { Message, Conversation, MessageReaction } from '../types/chat.types';
import { chatService } from '../services/chat.service';
import { userBlockService } from '../services/moderation.service';
import { storage } from '../utils/storage';
import { Ionicons } from '@expo/vector-icons';

export default function ConversationScreen({ route, navigation }: any) {
  const INITIAL_MESSAGE_LIMIT = 50;
  const INITIAL_REACTION_HYDRATION_LIMIT = 20;

  const { conversation } = route.params as { conversation: Conversation };
  const { colors } = useTheme();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<number>(1);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [reportingMessage, setReportingMessage] = useState<Message | null>(null);
  const flatListRef = useRef<FlatList>(null);

  const REPORT_REASONS = [
    { label: 'Inappropriate Language', value: 'inappropriate_language' },
    { label: 'Harassment', value: 'harassment' },
    { label: 'Spam', value: 'spam' },
    { label: 'Offensive Content', value: 'offensive_content' },
    { label: 'Misinformation', value: 'misinformation' },
    { label: 'Other', value: 'other' },
  ] as const;

  useEffect(() => {
    loadMessages();
    loadCurrentUser();
  }, []);

  const loadCurrentUser = async () => {
    try {
      const userData = await storage.getUserData();
      if (userData?.user_id) {
        setCurrentUserId(Number(userData.user_id));
      }
    } catch (err) {
      console.error('Error loading current user:', err);
      Alert.alert('Error', 'Failed to load user data.');
    }
  };

  const fetchReactionsForMessage = async (messageId: number, token: string) => {
    try {
      const reactions = await chatService.getReactions(messageId, token);
      return { messageId, reactions };
    } catch (err) {
      console.error('Error loading reactions for message:', messageId, err);
      return { messageId, reactions: [] };
    }
  };

  const mergeReactionsIntoMessages = (
    prevMessages: Message[],
    reactionEntries: Array<{ messageId: number; reactions: MessageReaction[] }>,
  ) => {
    const reactionsByMessageId = new Map(
      reactionEntries.map((entry) => [entry.messageId, entry.reactions]),
    );

    return prevMessages.map((msg) => {
      const reactions = reactionsByMessageId.get(msg.message_id);
      return reactions ? { ...msg, reactions } : msg;
    });
  };

  const hydrateReactions = async (messagesToHydrate: Message[], token: string) => {
    const reactionEntries = await Promise.all(
      messagesToHydrate.map((msg) => fetchReactionsForMessage(msg.message_id, token)),
    );

    setMessages((prevMessages) => mergeReactionsIntoMessages(prevMessages, reactionEntries));
  };

  const loadMessages = async () => {
    try {
      setLoading(true);
      const token = await storage.getToken();
      const data = await chatService.getMessages(
        conversation.conversation_id,
        token || 'mock-token',
        INITIAL_MESSAGE_LIMIT,
      );

      // Render messages immediately and load reactions in the background
      setMessages(data.map((msg) => ({ ...msg, reactions: msg.reactions ?? [] })));
      setLoading(false);

      const messagesForReactionHydration = data.slice(-INITIAL_REACTION_HYDRATION_LIMIT);
      void hydrateReactions(messagesForReactionHydration, token || 'mock-token');

      // Mark as read
      void chatService.markAsRead(conversation.conversation_id, token || 'mock-token');
    } catch (err) {
      console.error('Error loading messages:', err);
      Alert.alert('Error', 'Failed to load messages. Please try again.');
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
      setReplyingTo(null);

      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (err) {
      console.error('Error sending message:', err);
      Alert.alert('Error', 'Failed to send message. Please try again.');
    }
  };

  const handleSwipeReply = (message: Message) => {
    setReplyingTo(message);
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
  };

  const getReplyToMessage = (messageId: number | null | undefined): Message | null => {
    if (!messageId) return null;
    return messages.find((m) => m.message_id === messageId) || null;
  };

  const handleReport = (msg: Message) => {
    setReportingMessage(msg);
  };

  const submitReport = async (reason: string) => {
    if (!reportingMessage) return;
    try {
      const token = await storage.getToken();
      await chatService.reportMessage(
        {
          message_id: reportingMessage.message_id,
          conversation_id: conversation.conversation_id,
          reason,
        },
        token || '',
      );
      setReportingMessage(null);
      Alert.alert('Reported', 'Thank you. Our team will review this within 24 hours.');
    } catch (err) {
      console.error('Error reporting message:', err);
      setReportingMessage(null);
      Alert.alert('Error', 'Failed to submit report. Please try again.');
    }
  };

  const handleDeleteConversation = () => {
    Alert.alert(
      'Delete Conversation',
      'Are you sure you want to delete this entire conversation? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await storage.getToken();
              await chatService.deleteConversation(conversation.conversation_id, token || '');
              navigation.goBack();
            } catch (err) {
              console.error('Error deleting conversation:', err);
              Alert.alert('Error', 'Failed to delete conversation. Please try again.');
            }
          },
        },
      ],
    );
  };

  const handleBlockUser = () => {
    Alert.alert(
      'Block User',
      `Are you sure you want to block ${conversation.participant_username}? You will no longer receive messages from this user.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Block',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await storage.getToken();
              await userBlockService.blockUser(conversation.participant_id, token || '');
              Alert.alert('Blocked', `${conversation.participant_username} has been blocked.`);
              navigation.goBack();
            } catch (err) {
              console.error('Error blocking user:', err);
              Alert.alert('Error', 'Failed to block user. Please try again.');
            }
          },
        },
      ],
    );
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
      Alert.alert('Error', 'Failed to add reaction.');
    }
  };

  const getDayKey = (isoString: string) => {
    const date = new Date(isoString);
    return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
  };

  const formatDayHeader = (isoString: string) => {
    const messageDate = new Date(isoString);
    const today = new Date();

    if (getDayKey(isoString) === getDayKey(today.toISOString())) {
      return 'Today';
    }

    return messageDate.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const shouldShowDayHeader = (index: number) => {
    if (index === 0) return true;
    return getDayKey(messages[index].created_at) !== getDayKey(messages[index - 1].created_at);
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
        renderItem={({ item, index }) => (
          <>
            {shouldShowDayHeader(index) && (
              <View className="items-center my-2">
                <View
                  className="px-3 py-1 rounded-full"
                  style={{ backgroundColor: `${colors.white}40` }}
                >
                  <AppText className="text-[12px] font-semibold" style={{ color: colors.white }}>
                    {formatDayHeader(item.created_at)}
                  </AppText>
                </View>
              </View>
            )}

            <ChatBubble
              message={item}
              isOwnMessage={item.sender_id === currentUserId}
              onSwipeReply={handleSwipeReply}
              replyToMessage={getReplyToMessage(item.reply_to_message_id)}
              onReaction={handleReaction}
              onReport={handleReport}
              currentUserId={currentUserId}
            />
          </>
        )}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
        onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
      />
    );
  };

  return (
    <View className="flex-1" style={{ backgroundColor: colors.primary }}>
      {/* Custom Header */}
      <View
        className="pt-16 pb-3 px-4 border-b border-white/10"
        style={{ backgroundColor: colors.primary }}
      >
        <View className="flex-row items-center justify-center relative">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="absolute left-0 p-1"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={24} color={colors.white} />
          </TouchableOpacity>

          <AppText className="text-2xl font-semibold" style={{ color: colors.white }}>
            {conversation.participant_username}
          </AppText>

          <View className="absolute right-0 flex-row" style={{ gap: 12 }}>
            <TouchableOpacity
              onPress={handleBlockUser}
              className="p-1"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="ban-outline" size={22} color={colors.white} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleDeleteConversation}
              className="p-1"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="trash-outline" size={22} color={colors.white} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Messages Area with KeyboardAvoidingView */}
      <KeyboardAvoidingView className="flex-1" behavior="padding">
        {renderContent()}

        <ChatInput onSend={handleSend} replyingTo={replyingTo} onCancelReply={handleCancelReply} />
      </KeyboardAvoidingView>

      {/* Report Reason Picker Modal */}
      <Modal
        visible={!!reportingMessage}
        transparent
        animationType="fade"
        onRequestClose={() => setReportingMessage(null)}
      >
        <Pressable
          className="flex-1 justify-end bg-black/50"
          onPress={() => setReportingMessage(null)}
        >
          <Pressable
            className="w-full rounded-t-2xl p-6"
            style={{ backgroundColor: colors.primary }}
            onPress={() => {}}
          >
            <AppText className="text-xl font-bold mb-2" style={{ color: colors.white }}>
              Report Message
            </AppText>
            <AppText className="text-sm mb-5" style={{ color: `${colors.white}88` }}>
              Why are you reporting this message?
            </AppText>

            {REPORT_REASONS.map((reason) => (
              <TouchableOpacity
                key={reason.value}
                className="p-4 rounded-lg mb-2"
                style={{ backgroundColor: `${colors.primaryDark}55` }}
                onPress={() => submitReport(reason.value)}
              >
                <AppText className="font-semibold" style={{ color: colors.white }}>
                  {reason.label}
                </AppText>
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              className="mt-2 p-4 rounded-lg items-center"
              style={{ backgroundColor: `${colors.white}20` }}
              onPress={() => setReportingMessage(null)}
            >
              <AppText className="font-semibold" style={{ color: colors.white }}>
                Cancel
              </AppText>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
