import React from 'react';
import { View, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import AppText from '../UI/textWrapper';
import { Conversation } from '../../types/chat.types';

interface ChatListProps {
  conversations: Conversation[];
  loading: boolean;
  onConversationPress: (conversation: Conversation) => void;
}

const ChatList: React.FC<ChatListProps> = ({ conversations, loading, onConversationPress }) => {
  const { colors } = useTheme();

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getPreviewText = (lastMessage: string | null | undefined) => {
    if (!lastMessage) return 'No messages yet';

    try {
      const parsed = JSON.parse(lastMessage);

      // Shared mantra preview
      if (parsed?.type === 'mantra_share') {
        return 'Shared a mantra';
      }
    } catch {
      // normal text otherwise
    }

    return lastMessage;
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center px-5">
        <ActivityIndicator color={colors.secondary} size="large" />
        <AppText className="mt-4" style={{ color: colors.text }}>
          Loading conversations...
        </AppText>
      </View>
    );
  }

  if (conversations.length === 0) {
    return (
      <View className="flex-1 justify-center items-center px-5">
        <AppText className="text-base text-center" style={{ color: colors.text }}>
          No conversations yet.{'\n'}Start chatting with other users!
        </AppText>
      </View>
    );
  }

  return (
    <FlatList
      data={conversations}
      keyExtractor={(item) => item.conversation_id.toString()}
      contentContainerStyle={{ paddingVertical: 8, paddingHorizontal: 16 }}
      renderItem={({ item }) => (
        <TouchableOpacity
          className="flex-row px-3 py-4 rounded-xl mb-2"
          style={{
            backgroundColor: colors.white,
          }}
          onPress={() => onConversationPress(item)}
        >
          <View className="mr-3">
            <View
              className="w-[50px] h-[50px] rounded-full items-center justify-center"
              style={{
                backgroundColor: colors.primaryDark,
              }}
            >
              <AppText
                className="text-[20px] font-bold"
                style={{
                  color: colors.text,
                }}
              >
                {item.participant_username.charAt(0).toUpperCase()}
              </AppText>
            </View>
          </View>

          <View className="flex-1 justify-center">
            <View className="flex-row justify-between items-center mb-1">
              <AppText
                className="text-[17px] font-semibold"
                style={{
                  color: colors.primaryDark,
                }}
                numberOfLines={1}
              >
                {item.participant_username}
              </AppText>
              <AppText
                className="text-[12px]"
                style={{
                  color: `${colors.primaryDark}99`,
                }}
              >
                {formatTime(item.last_message_time)}
              </AppText>
            </View>

            <View className="flex-row items-center">
              <AppText
                className="text-[14px] flex-1"
                style={{
                  color: `${colors.primaryDark}cc`,
                }}
                numberOfLines={1}
              >
                {getPreviewText(item.last_message)}
              </AppText>
              {item.unread_count > 0 && (
                <View
                  className="min-w-[20px] h-[20px] rounded-[10px] items-center justify-center px-[6px] ml-2"
                  style={{
                    backgroundColor: colors.secondary,
                  }}
                >
                  <AppText
                    className="text-[12px] font-bold"
                    style={{
                      color: colors.primaryDark,
                    }}
                  >
                    {item.unread_count}
                  </AppText>
                </View>
              )}
            </View>
          </View>
        </TouchableOpacity>
      )}
    />
  );
};

export default ChatList;
