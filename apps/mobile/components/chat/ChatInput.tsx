import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import AppText from '../UI/textWrapper';
import { Message } from '../../types/chat.types';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  replyingTo?: Message | null;
  onCancelReply?: () => void;
}

const ChatInput: React.FC<ChatInputProps> = ({
  onSend,
  disabled = false,
  replyingTo,
  onCancelReply,
}) => {
  const { colors } = useTheme();
  const [message, setMessage] = useState('');

  const handleSend = () => {
    if (message.trim()) {
      onSend(message.trim());
      setMessage('');
    }
  };

  return (
    <View
      style={[
        styles.outerContainer,
        {
          backgroundColor: colors.primary,
        },
      ]}
    >
      {/* Reply Preview */}
      {replyingTo &&
        (() => {
          let parsed: any = null;
          try {
            parsed = JSON.parse(replyingTo.content);
          } catch {
            parsed = null;
          }

          const isMantraShare = parsed?.type === 'mantra_share';
          const displayText = isMantraShare
            ? `Mantra: ${parsed.text ?? 'Shared mantra'}`
            : replyingTo.content;

          return (
            <View
              style={[
                styles.replyPreview,
                {
                  backgroundColor: colors.primaryDark,
                  borderTopColor: `${colors.primaryDark}33`,
                },
              ]}
            >
              <View style={styles.replyContent}>
                <AppText style={[styles.replyLabel, { color: colors.secondary }]}>
                  Replying to:
                </AppText>
                <AppText style={[styles.replyText, { color: '#ffffff' }]} numberOfLines={1}>
                  {displayText}
                </AppText>
              </View>
              <TouchableOpacity
                onPress={onCancelReply}
                style={styles.cancelButton}
                testID="cancel-reply-button"
              >
                <Ionicons name="close-circle" size={24} color={colors.secondary} />
              </TouchableOpacity>
            </View>
          );
        })()}

      {/* Input Container */}
      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.primary,
            borderTopColor: `${colors.primaryDark}33`,
          },
        ]}
      >
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: '#ffffff',
              color: colors.primaryDark,
            },
          ]}
          placeholder="Type a message..."
          placeholderTextColor="#999"
          value={message}
          onChangeText={setMessage}
          multiline
          maxLength={500}
          editable={!disabled}
          onSubmitEditing={handleSend}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            {
              backgroundColor: message.trim() ? colors.secondary : `${colors.secondary}66`,
            },
          ]}
          onPress={handleSend}
          disabled={disabled || !message.trim()}
          testID="send-button"
        >
          <Ionicons
            name="send"
            size={20}
            color={message.trim() ? colors.primaryDark : `${colors.primaryDark}66`}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {},
  replyPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  replyContent: {
    flex: 1,
    marginRight: 8,
  },
  replyLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  replyText: {
    fontSize: 14,
  },
  cancelButton: {
    padding: 4,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    fontFamily: 'LibreBaskerville-Regular',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
});

export default ChatInput;
