import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import AppText from '../components/UI/textWrapper';
import ChatList from '../components/chat/ChatList';
import { Conversation } from '../types/chat.types';
import { chatService } from '../services/chat.service';
import { storage } from '../utils/storage';

export default function ChatScreen({ navigation }: any) {
  const { colors } = useTheme();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConversations();
    const unsubscribe = navigation.addListener('focus', () => {
      loadConversations();
    });
    return unsubscribe;
  }, [navigation]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const token = await storage.getToken();
      const data = await chatService.getConversations(token || 'mock-token');
      setConversations(data);
    } catch (err) {
      console.error('Error loading conversations:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleConversationPress = (conversation: Conversation) => {
    navigation.navigate('Conversation', {
      conversation,
    });
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
        loading={loading}
        onConversationPress={handleConversationPress}
      />

      {/* Floating Action Button for New Conversation */}
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
