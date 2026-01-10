import React, { useState, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Modal, Pressable } from 'react-native';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { useTheme } from '../../context/ThemeContext';
import AppText from '../UI/textWrapper';
import { useNavigation } from '@react-navigation/native';
import { Message, MessageReaction } from '../../types/chat.types';

interface ChatBubbleProps {
  message: Message;
  isOwnMessage: boolean;
  onSwipeReply?: (message: Message) => void;
  replyToMessage?: Message | null;
  onReaction?: (messageId: number, emoji: string) => void;
  currentUserId?: number;
}

const EMOJI_OPTIONS = ['👍', '👎', '❤️', '😂', '😮', '😢', '🙏'];

const ChatBubble: React.FC<ChatBubbleProps> = ({
  message,
  isOwnMessage,
  onSwipeReply,
  replyToMessage,
  onReaction,
  currentUserId,
}) => {
  const { colors } = useTheme();
  const navigation = useNavigation<any>();
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const swipeableRef = useRef<Swipeable>(null);

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const { content, created_at } = message;

  const handleEmojiSelect = (emoji: string) => {
    if (onReaction) {
      onReaction(message.message_id, emoji);
    }
    setShowEmojiPicker(false);
  };

  const handleLongPress = () => {
    setShowEmojiPicker(true);
  };

  const handleSwipeRight = () => {
    if (onSwipeReply) {
      onSwipeReply(message);
    }
    setTimeout(() => swipeableRef.current?.close(), 0);
  };

  const renderReactions = () => {
    if (!message.reactions || message.reactions.length === 0) {
      return null;
    }

    return (
      <View
        style={[
          styles.reactionsContainer,
          isOwnMessage ? styles.reactionsRight : styles.reactionsLeft,
        ]}
      >
        {message.reactions.map((reaction: MessageReaction, index: number) => {
          const userReacted = currentUserId ? reaction.users.includes(currentUserId) : false;
          return (
            <TouchableOpacity
              key={`${reaction.emoji}-${index}`}
              style={[
                styles.reactionBubble,
                {
                  backgroundColor: userReacted ? colors.secondary : `${colors.primaryDark}20`,
                  borderColor: userReacted ? colors.primaryDark : 'transparent',
                  borderWidth: userReacted ? 1.5 : 0,
                },
              ]}
              onPress={() => handleEmojiSelect(reaction.emoji)}
              activeOpacity={0.7}
            >
              <AppText style={styles.reactionEmoji}>{reaction.emoji}</AppText>
              {reaction.count > 1 && (
                <AppText style={[styles.reactionCount, { color: colors.primaryDark }]}>
                  {reaction.count}
                </AppText>
              )}
            </TouchableOpacity>
          );
        })}
        <TouchableOpacity
          style={[styles.reactionBubble, { backgroundColor: `${colors.primaryDark}15` }]}
          onPress={handleLongPress}
          activeOpacity={0.7}
        >
          <AppText style={styles.addReactionText}>+</AppText>
        </TouchableOpacity>
      </View>
    );
  };

  const renderEmojiPicker = () => (
    <Modal
      visible={showEmojiPicker}
      transparent
      animationType="fade"
      onRequestClose={() => setShowEmojiPicker(false)}
    >
      <Pressable style={styles.modalOverlay} onPress={() => setShowEmojiPicker(false)}>
        <View style={[styles.emojiPickerContainer, { backgroundColor: colors.primary }]}>
          <AppText style={[styles.emojiPickerTitle, { color: colors.primaryDark }]}>
            React with an emoji
          </AppText>
          <View style={styles.emojiGrid}>
            {EMOJI_OPTIONS.map((emoji) => (
              <TouchableOpacity
                key={emoji}
                style={styles.emojiOption}
                onPress={() => handleEmojiSelect(emoji)}
                activeOpacity={0.7}
              >
                <AppText style={styles.emojiOptionText}>{emoji}</AppText>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Pressable>
    </Modal>
  );

  // share a mantra
  let parsed: any = null;
  try {
    parsed = JSON.parse(content);
  } catch {
    parsed = null;
  }

  const renderLeftActions = () => (
    <View style={styles.swipeActionContainer}>
      <AppText style={styles.swipeActionText}>Reply</AppText>
    </View>
  );

  //
  if (parsed?.type === 'mantra_share') {
    return (
      <>
        {renderEmojiPicker()}
        <Swipeable
          ref={swipeableRef}
          renderLeftActions={renderLeftActions}
          onSwipeableWillOpen={handleSwipeRight}
          overshootLeft={false}
        >
          <View
            style={[
              styles.container,
              isOwnMessage ? styles.ownMessageContainer : styles.otherMessageContainer,
            ]}
          >
            <TouchableOpacity
              onPress={() =>
                navigation.navigate('MainApp', {
                  screen: 'Home',
                  params: { returnToMantraId: parsed.mantra_id },
                })
              }
              onLongPress={handleLongPress}
              activeOpacity={0.85}
              style={[
                styles.bubble,
                styles.mantraBubble,
                {
                  backgroundColor: colors.secondary,
                },
              ]}
            >
              {/* Show reply context if this is a reply */}
              {replyToMessage &&
                (() => {
                  let replyParsed: any = null;
                  try {
                    replyParsed = JSON.parse(replyToMessage.content);
                  } catch {
                    replyParsed = null;
                  }

                  const isReplyToMantra = replyParsed?.type === 'mantra_share';
                  const replyDisplayText = isReplyToMantra
                    ? `🧘 ${replyParsed.text ?? 'Shared mantra'}`
                    : replyToMessage.content;

                  return (
                    <View
                      style={[
                        styles.replyContainer,
                        {
                          backgroundColor: `${colors.primaryDark}20`,
                          borderLeftColor: colors.primaryDark,
                        },
                      ]}
                    >
                      <AppText
                        style={[
                          styles.replyText,
                          {
                            color: colors.primaryDark,
                          },
                        ]}
                        numberOfLines={2}
                      >
                        {replyDisplayText}
                      </AppText>
                    </View>
                  );
                })()}

              <AppText style={[styles.mantraLabel, { color: colors.primaryDark }]}>
                {isOwnMessage ? 'You shared a mantra' : 'Shared a mantra'}
              </AppText>

              <AppText style={[styles.mantraTitle, { color: colors.primaryDark }]}>
                “{parsed.text ?? 'Open mantra'}”
              </AppText>

              <AppText style={[styles.mantraCTA, { color: colors.primaryDark }]}>
                Tap to view
              </AppText>

              <AppText style={[styles.timestamp, { color: `${colors.primaryDark}99` }]}>
                {formatTime(created_at)}
              </AppText>
            </TouchableOpacity>
            {renderReactions()}
          </View>
        </Swipeable>
      </>
    );
  }

  //text message
  return (
    <>
      {renderEmojiPicker()}
      <Swipeable
        ref={swipeableRef}
        renderLeftActions={renderLeftActions}
        onSwipeableWillOpen={handleSwipeRight}
        overshootLeft={false}
      >
        <View
          style={[
            styles.container,
            isOwnMessage ? styles.ownMessageContainer : styles.otherMessageContainer,
          ]}
        >
          <TouchableOpacity
            activeOpacity={0.9}
            onLongPress={handleLongPress}
            style={[
              styles.bubble,
              {
                backgroundColor: isOwnMessage ? colors.secondary : colors.primaryDark,
              },
            ]}
          >
            {/* Show reply context if this is a reply */}
            {replyToMessage &&
              (() => {
                let replyParsed: any = null;
                try {
                  replyParsed = JSON.parse(replyToMessage.content);
                } catch {
                  replyParsed = null;
                }

                const isReplyToMantra = replyParsed?.type === 'mantra_share';
                const replyDisplayText = isReplyToMantra
                  ? ` ${replyParsed.text ?? 'Shared mantra'}`
                  : replyToMessage.content;

                return (
                  <View
                    style={[
                      styles.replyContainer,
                      {
                        backgroundColor: isOwnMessage ? `${colors.primaryDark}20` : '#ffffff20',
                        borderLeftColor: isOwnMessage ? colors.primaryDark : '#ffffff',
                      },
                    ]}
                  >
                    <AppText
                      style={[
                        styles.replyText,
                        {
                          color: isOwnMessage ? colors.primaryDark : '#ffffff',
                        },
                      ]}
                      numberOfLines={2}
                    >
                      {replyDisplayText}
                    </AppText>
                  </View>
                );
              })()}

            <AppText
              style={[
                styles.messageText,
                {
                  color: isOwnMessage ? colors.primaryDark : '#ffffff',
                },
              ]}
            >
              {content}
            </AppText>
            <AppText
              style={[
                styles.timestamp,
                {
                  color: isOwnMessage ? `${colors.primaryDark}99` : '#ffffff99',
                },
              ]}
            >
              {formatTime(created_at)}
            </AppText>
          </TouchableOpacity>
          {renderReactions()}
        </View>
      </Swipeable>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
    paddingHorizontal: 12,
  },
  ownMessageContainer: {
    alignItems: 'flex-end',
  },
  otherMessageContainer: {
    alignItems: 'flex-start',
  },
  bubble: {
    maxWidth: '75%',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 18,
  },

  //Mantra bubble for messaginf
  mantraBubble: {
    paddingVertical: 14,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  mantraLabel: {
    fontSize: 12,
    opacity: 0.7,
    marginBottom: 4,
  },
  mantraTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 6,
  },
  mantraCTA: {
    fontSize: 12,
    opacity: 0.85,
    marginBottom: 6,
  },

  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  timestamp: {
    fontSize: 11,
    marginTop: 4,
  },
  replyContainer: {
    borderLeftWidth: 3,
    paddingLeft: 8,
    paddingVertical: 6,
    marginBottom: 8,
    borderRadius: 4,
  },
  replyText: {
    fontSize: 13,
    opacity: 0.8,
    fontStyle: 'italic',
  },
  reactionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
    gap: 6,
  },
  reactionsLeft: {
    justifyContent: 'flex-start',
  },
  reactionsRight: {
    justifyContent: 'flex-end',
  },
  reactionBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  reactionEmoji: {
    fontSize: 14,
  },
  reactionCount: {
    fontSize: 11,
    fontWeight: '600',
  },
  addReactionText: {
    fontSize: 16,
    fontWeight: '600',
    opacity: 0.6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emojiPickerContainer: {
    borderRadius: 16,
    padding: 20,
    width: '80%',
    maxWidth: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  emojiPickerTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    gap: 12,
  },
  emojiOption: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 25,
  },
  emojiOptionText: {
    fontSize: 32,
  },
  swipeActionContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginVertical: 4,
  },
  swipeActionText: {
    fontSize: 14,
    opacity: 0.6,
  },
});

export { ChatBubble };
