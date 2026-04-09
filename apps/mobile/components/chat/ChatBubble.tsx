import React, { useState, useRef } from 'react';
import {
  View,
  TouchableOpacity,
  Modal,
  Pressable,
  Animated,
  PanResponder,
  Text,
  ActionSheetIOS,
  Platform,
  Alert,
} from 'react-native';
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
  onReport?: (message: Message) => void;
  currentUserId?: number;
}

const EMOJI_OPTIONS = ['👍', '👎', '❤️', '😂', '😮', '😢', '🙏'];

const ChatBubble: React.FC<ChatBubbleProps> = ({
  message,
  isOwnMessage,
  onSwipeReply,
  replyToMessage,
  onReaction,
  onReport,
  currentUserId,
}) => {
  const { colors } = useTheme();
  const navigation = useNavigation<any>();
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const translateX = useRef(new Animated.Value(0)).current;

  /* istanbul ignore next */
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 5;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dx > 0 && gestureState.dx < 80) {
          translateX.setValue(gestureState.dx);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx > 60 && onSwipeReply) {
          onSwipeReply(message);
        }
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
          tension: 100,
          friction: 10,
        }).start();
      },
    }),
  ).current;

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
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'React', 'Report'],
          cancelButtonIndex: 0,
          destructiveButtonIndex: 2,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            setShowEmojiPicker(true);
          } else if (buttonIndex === 2 && onReport) {
            onReport(message);
          }
        },
      );
    } else {
      Alert.alert('Message Options', 'Choose an action', [
        { text: 'React', onPress: () => setShowEmojiPicker(true) },
        {
          text: 'Report',
          style: 'destructive',
          onPress: () => onReport?.(message),
        },
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  };

  const renderReactions = () => {
    if (!message.reactions || message.reactions.length === 0) {
      return null;
    }

    return (
      <View
        className={`flex-row flex-wrap mt-1 gap-[6px] ${
          isOwnMessage ? 'justify-end' : 'justify-start'
        }`}
      >
        {message.reactions.map((reaction: MessageReaction, index: number) => {
          const userReacted = currentUserId ? reaction.users.includes(currentUserId) : false;
          return (
            <TouchableOpacity
              key={`${reaction.emoji}-${index}`}
              className={`flex-row items-center pl-1 rounded-xl gap-1 ${
                userReacted ? 'border-[1.5px]' : 'border-0'
              }`}
              style={{
                backgroundColor: 'transparent',
                borderColor: 'transparent',
              }}
              onPress={() => handleEmojiSelect(reaction.emoji)}
              activeOpacity={0.7}
            >
              <AppText className="text-[15px]">{reaction.emoji}</AppText>
              {reaction.count > 1 && (
                <AppText
                  className="text-[12px] font-semibold"
                  style={{ color: colors.primaryDark }}
                >
                  {reaction.count}
                </AppText>
              )}
            </TouchableOpacity>
          );
        })}
        <TouchableOpacity
          className="flex-row items-center px-2 py-1 rounded-xl"
          style={{ backgroundColor: `${colors.primaryDark}15` }}
          onPress={handleLongPress}
          activeOpacity={0.7}
        >
          <AppText className="text-[17px] font-semibold opacity-60">+</AppText>
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
      <Pressable
        className="flex-1 justify-center items-center bg-black/50"
        onPress={() => setShowEmojiPicker(false)}
      >
        <View
          className="rounded-2xl p-5 w-4/5 max-w-[300px] shadow-lg"
          style={{
            backgroundColor: colors.white,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 4,
            elevation: 5,
          }}
        >
          <AppText
            className="text-[17px] font-semibold mb-4 text-center"
            style={{ color: colors.primaryDark }}
          >
            React with an emoji
          </AppText>
          <View className="flex-row flex-wrap justify-center gap-3">
            {EMOJI_OPTIONS.map((emoji) => (
              <TouchableOpacity
                key={emoji}
                className="w-[44px] h-[44px] justify-center items-center rounded-full"
                onPress={() => handleEmojiSelect(emoji)}
                activeOpacity={0.7}
              >
                <Text style={{ fontSize: 28, textAlign: 'center' }}>{emoji}</Text>
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

  //
  if (parsed?.type === 'mantra_share') {
    return (
      <>
        {renderEmojiPicker()}
        <Animated.View {...panResponder.panHandlers} style={[{ transform: [{ translateX }] }]}>
          <View className={`my-1 px-3 ${isOwnMessage ? 'items-end' : 'items-start'}`}>
            <TouchableOpacity
              onPress={() =>
                navigation.navigate('MainApp', {
                  screen: 'Home',
                  params: { returnToMantraId: parsed.mantra_id },
                })
              }
              onLongPress={handleLongPress}
              activeOpacity={0.85}
              className="max-w-[75%] px-4 py-[14px] rounded-2xl"
              style={{
                backgroundColor: colors.secondary,
                shadowColor: '#000',
                shadowOpacity: 0.15,
                shadowRadius: 4,
                elevation: 3,
              }}
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
                      className="border-l-[3px] pl-2 py-[6px] mb-2 rounded"
                      style={{
                        backgroundColor: `${colors.primaryDark}20`,
                        borderLeftColor: colors.primaryDark,
                      }}
                    >
                      <AppText
                        className="text-[14px] opacity-80 italic"
                        style={{ color: colors.primaryDark }}
                        numberOfLines={2}
                      >
                        {replyDisplayText}
                      </AppText>
                    </View>
                  );
                })()}

              <AppText
                className="text-[13px] opacity-70 mb-1"
                style={{ color: colors.primaryDark }}
              >
                {isOwnMessage ? 'You shared a mantra' : 'Shared a mantra'}
              </AppText>

              <AppText
                className="text-[18px] font-semibold mb-[6px]"
                style={{ color: colors.primaryDark }}
              >
                "{parsed.text ?? 'Open mantra'}"
              </AppText>

              <AppText
                className="text-[13px] opacity-85 mb-[6px]"
                style={{ color: colors.primaryDark }}
              >
                Tap to view
              </AppText>

              <AppText className="text-[12px] mt-1" style={{ color: `${colors.primaryDark}99` }}>
                {formatTime(created_at)}
              </AppText>
            </TouchableOpacity>
            {renderReactions()}
          </View>
        </Animated.View>
      </>
    );
  }

  //text message
  return (
    <>
      {renderEmojiPicker()}
      <Animated.View {...panResponder.panHandlers} style={[{ transform: [{ translateX }] }]}>
        <View className={`my-1 px-3 ${isOwnMessage ? 'items-end' : 'items-start'}`}>
          <TouchableOpacity
            activeOpacity={0.9}
            onLongPress={handleLongPress}
            className="max-w-[75%] px-4 py-[10px] rounded-[18px]"
            style={{
              backgroundColor: isOwnMessage ? colors.white : colors.primaryDark,
            }}
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
                    className="border-l-[3px] pl-2 py-[6px] mb-2 rounded"
                    style={{
                      backgroundColor: isOwnMessage ? `${colors.primaryDark}20` : '#ffffff20',
                      borderLeftColor: isOwnMessage ? colors.primaryDark : '#ffffff',
                    }}
                  >
                    <AppText
                      className="text-[14px] opacity-80 italic"
                      style={{
                        color: isOwnMessage ? colors.primaryDark : '#ffffff',
                      }}
                      numberOfLines={2}
                    >
                      {replyDisplayText}
                    </AppText>
                  </View>
                );
              })()}

            <AppText
              className="text-[17px] leading-[22px]"
              style={{
                color: isOwnMessage ? colors.primaryDark : '#ffffff',
              }}
            >
              {content}
            </AppText>
            <AppText
              className="text-[12px] mt-1"
              style={{
                color: isOwnMessage ? `${colors.primaryDark}99` : '#ffffff99',
              }}
            >
              {formatTime(created_at)}
            </AppText>
          </TouchableOpacity>
          {renderReactions()}
        </View>
      </Animated.View>
    </>
  );
};

export { ChatBubble };
