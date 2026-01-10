import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import AppText from '../components/UI/textWrapper';
import ChatList from '../components/chat/ChatList';
import { Conversation } from '../types/chat.types';
import { chatService } from '../services/chat.service';
import { storage } from '../utils/storage';
import { Mantra } from '../services/mantra.service';

export default function ShareMantraScreen({ route, navigation }: any) {
  const { mantra } = route.params as { mantra: Mantra };
  const { colors } = useTheme();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    navigation.setOptions({ title: 'Share mantra' });
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const token = await storage.getToken();
      const data = await chatService.getConversations(token || 'mock-token');
      setConversations(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const sendToConversation = async (conversation: Conversation) => {
    try {
      const token = await storage.getToken();

      //send payload of mantra to show in the text messages
      const payload = JSON.stringify({
        type: 'mantra_share',
        mantra_id: mantra.mantra_id,
        text: mantra.title,
      });

      await chatService.sendMessage(
        { conversation_id: conversation.conversation_id, content: payload },
        token || 'mock-token',
      );

      navigation.navigate('MainApp', {
        screen: 'Home',
        params: { returnToMantraId: mantra.mantra_id },
      });
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to share the mantra');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.primary }]}>
      <AppText style={{ color: colors.text, paddingHorizontal: 16, paddingVertical: 12 }}>
        Select a conversation to share:
      </AppText>

      <ChatList
        conversations={conversations}
        loading={loading}
        onConversationPress={sendToConversation}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
