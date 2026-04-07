import React, { useCallback } from 'react';
import { View, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import AppText from '../components/UI/textWrapper';
import ChatList from '../components/chat/ChatList';
import { useConversations } from '../hooks';

export default function ChatScreen({ navigation }: any) {
  const { colors } = useTheme();
  const { data: conversations = [], isLoading, refetch } = useConversations();

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

  const handleConversationPress = (conversation: any) => {
    navigation.navigate('Conversation', { conversation });
  };

  const handleNewConversation = () => {
    navigation.navigate('NewConversation');
  };

  return (
    <View className="flex-1" style={{ backgroundColor: colors.primary }}>
      <View className="pt-[60px] pb-4 px-[30px]" style={{ backgroundColor: colors.primary }}>
        <AppText className="text-[30px] font-bold" style={{ color: colors.text }}>
          Messages
        </AppText>
      </View>

      <ChatList
        conversations={conversations}
        loading={isLoading}
        onConversationPress={handleConversationPress}
      />

      <TouchableOpacity
        className="absolute bottom-5 right-5 w-14 h-14 rounded-[28px] items-center justify-center shadow-lg"
        style={{ backgroundColor: colors.secondary }}
        onPress={handleNewConversation}
      >
        <AppText className="text-2xl font-bold" style={{ color: colors.primaryDark }}>
          +
        </AppText>
      </TouchableOpacity>
    </View>
  );
}
