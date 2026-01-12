import React from 'react';
import { View, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
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
      <View style={styles.centerContainer}>
        <ActivityIndicator color={colors.secondary} size="large" />
        <AppText style={{ color: colors.text, marginTop: 16 }}>Loading conversations...</AppText>
      </View>
    );
  }

  if (conversations.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <AppText style={{ color: colors.text, fontSize: 16, textAlign: 'center' }}>
          No conversations yet.{'\n'}Start chatting with other users!
        </AppText>
      </View>
    );
  }

  return (
    <FlatList
      data={conversations}
      keyExtractor={(item) => item.conversation_id.toString()}
      contentContainerStyle={styles.listContent}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={[
            styles.conversationItem,
            {
              backgroundColor: `${colors.primaryDark}33`,
            },
          ]}
          onPress={() => onConversationPress(item)}
        >
          <View style={styles.avatarContainer}>
            <View
              style={[
                styles.avatar,
                {
                  backgroundColor: colors.secondary,
                },
              ]}
            >
              <AppText
                style={{
                  color: colors.primaryDark,
                  fontSize: 20,
                  fontWeight: 'bold',
                }}
              >
                {item.participant_username.charAt(0).toUpperCase()}
              </AppText>
            </View>
          </View>

          <View style={styles.conversationContent}>
            <View style={styles.conversationHeader}>
              <AppText
                style={{
                  color: colors.text,
                  fontSize: 17,
                  fontWeight: '600',
                }}
                numberOfLines={1}
              >
                {item.participant_username}
              </AppText>
              <AppText
                style={{
                  color: `${colors.text}99`,
                  fontSize: 12,
                }}
              >
                {formatTime(item.last_message_time)}
              </AppText>
            </View>

            <View style={styles.messagePreviewContainer}>
              <AppText
                style={{
                  color: `${colors.text}cc`,
                  fontSize: 14,
                  flex: 1,
                }}
                numberOfLines={1}
              >
                {getPreviewText(item.last_message)}
              </AppText>
              {item.unread_count > 0 && (
                <View
                  style={[
                    styles.unreadBadge,
                    {
                      backgroundColor: colors.secondary,
                    },
                  ]}
                >
                  <AppText
                    style={{
                      color: colors.primaryDark,
                      fontSize: 12,
                      fontWeight: 'bold',
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

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  listContent: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  conversationItem: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  conversationContent: {
    flex: 1,
    justifyContent: 'center',
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  messagePreviewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    marginLeft: 8,
  },
});

export default ChatList;
