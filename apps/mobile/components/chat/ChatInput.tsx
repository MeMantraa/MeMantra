import React, { useState } from 'react';
import { View, TouchableOpacity, TextInput } from 'react-native';
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
    <View style={{ backgroundColor: colors.primary }}>
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
              className="flex-row items-center justify-between px-4 py-[10px] border-t"
              style={{
                backgroundColor: colors.primaryDark,
                borderTopColor: `${colors.primaryDark}33`,
              }}
            >
              <View className="flex-1 mr-2">
                <AppText
                  className="text-[12px] font-semibold mb-[2px]"
                  style={{ color: colors.secondary }}
                >
                  Replying to:
                </AppText>
                <AppText className="text-[14px]" style={{ color: '#ffffff' }} numberOfLines={1}>
                  {displayText}
                </AppText>
              </View>
              <TouchableOpacity
                onPress={onCancelReply}
                className="p-1"
                testID="cancel-reply-button"
              >
                <Ionicons name="close-circle" size={24} color={colors.secondary} />
              </TouchableOpacity>
            </View>
          );
        })()}

      {/* Input Container */}
      <View
        className="flex-row items-end px-3 py-2 border-t"
        style={{
          backgroundColor: colors.primary,
          borderTopColor: `${colors.primaryDark}33`,
        }}
      >
        <TextInput
          className="flex-1 min-h-[40px] max-h-[100px] rounded-[20px] px-4 py-[10px] text-[16px] bg-white"
          style={{
            color: colors.primaryDark,
            fontFamily: 'LibreBaskerville-Regular',
          }}
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
          className="w-[40px] h-[40px] rounded-[20px] items-center justify-center ml-2"
          style={{
            backgroundColor: message.trim() ? colors.secondary : `${colors.secondary}66`,
          }}
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

export default ChatInput;
