import React, { useEffect } from 'react';
import { View, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import AppText from '../components/UI/textWrapper';
import ChatList from '../components/chat/ChatList';
import { Conversation } from '../types/chat.types';
import { Mantra } from '../services/mantra.service';
import { Ionicons } from '@expo/vector-icons';
import { useConversations, useSendMessage } from '../hooks';

export default function ShareMantraScreen({ route, navigation }: any) {
  const { mantra } = route.params as { mantra: Mantra };
  const { colors } = useTheme();
  const { data: conversations = [], isLoading } = useConversations();
  const sendMessage = useSendMessage();

  useEffect(() => {
    navigation.setOptions({ title: 'Share mantra' });
  }, []);

  const sendToConversation = (conversation: Conversation) => {
    const payload = JSON.stringify({
      type: 'mantra_share',
      mantra_id: mantra.mantra_id,
      text: mantra.title,
    });
    sendMessage.mutate(
      { conversationId: conversation.conversation_id, content: payload },
      {
        onSuccess: () =>
          navigation.navigate('MainApp', {
            screen: 'Home',
            params: { returnToMantraId: mantra.mantra_id },
          }),
        onError: () => Alert.alert('Error', 'Failed to share the mantra'),
      },
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.primary }]}>
      <View style={styles.headerRow}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <AppText style={{ color: colors.text, paddingHorizontal: 16, paddingVertical: 12 }}>
        Select a conversation to share:
      </AppText>

      <ChatList
        conversations={conversations}
        loading={isLoading}
        onConversationPress={sendToConversation}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerRow: {
    paddingTop: 48,
    paddingHorizontal: 8,
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
