import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
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
    <View className="flex-1 pt-16 pb-4 px-[30px]" style={{ backgroundColor: colors.primary }}>
      <AppText
        className="text-[30px] text-left mt-2"
        style={{ backgroundColor: colors.primary, color: colors.text }}
      >
        Messages
      </AppText>
      <ChatList
        conversations={conversations}
        loading={loading}
        onConversationPress={handleConversationPress}
      />

      {/* Floating Action Button for New Conversation */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.secondary }]}
        onPress={handleNewConversation}
      >
        <AppText style={[styles.fabText, { color: colors.primaryDark }]}>+</AppText>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  fabText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
});
