import React, { useState, useEffect, useCallback } from 'react';
import { View, FlatList, TouchableOpacity, ActivityIndicator, TextInput } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import AppText from '../components/UI/textWrapper';
import { User, userService } from '../services/user.service';
import { chatService } from '../services/chat.service';
import { storage } from '../utils/storage';
import { usePostHogScreen } from '../utils/posthog';
import { posthog } from '../services/posthog';

export default function NewConversationScreen({ navigation }: any) {
  usePostHogScreen();
  const { colors } = useTheme();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [creating, setCreating] = useState(false);

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      const token = await storage.getToken();
      const response = await userService.getAllUsers(token || '');

      if (response.status === 'success') {
        // Filter out current user and everyone's emails
        const currentUserId = await storage.getUserId();
        const otherUsers = response.data.users
          .filter((user) => user.user_id !== currentUserId)
          .map((user) => ({
            ...user,
            email: null, //hide email
          }));
        setUsers(otherUsers);
      }
    } catch (err) {
      console.error('Error loading users:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleBack = () => {
    posthog.capture('new_conversation_back_pressed');
    navigation.goBack();
  };

  const filterUsers = useCallback(() => {
    const q = searchText.trim().toLowerCase();

    if (!q) {
      setFilteredUsers([]);
      return;
    }

    const filtered = users.filter((user) => (user.username ?? '').toLowerCase().includes(q));

    setFilteredUsers(filtered);
  }, [searchText, users]);

  useEffect(() => {
    filterUsers();
  }, [filterUsers]);

  const handleUserSelect = async (user: User) => {
    try {
      posthog.capture('new_conversation_user_selected', { user_id: user.user_id });
      setCreating(true);
      const token = await storage.getToken();

      const conversation = await chatService.createConversation(
        { participant_id: user.user_id },
        token || '',
      );

      navigation.replace('Conversation', { conversation });
      posthog.capture('new_conversation_create_success', {
        conversation_id: conversation.conversation_id,
      });
    } catch (err) {
      console.error('Error creating conversation:', err);
      posthog.capture('new_conversation_create_failed');
      alert('Failed to start conversation. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const renderUserItem = ({ item }: { item: User }) => (
    <TouchableOpacity
      className="flex-row items-center p-3 rounded-xl mb-2"
      style={{ backgroundColor: `${colors.primaryDark}33` }}
      onPress={() => handleUserSelect(item)}
      disabled={creating}
    >
      <View className="mr-3">
        <View
          className="w-[50px] h-[50px] rounded-full items-center justify-center"
          style={{ backgroundColor: colors.secondary }}
        >
          <AppText
            style={{
              color: colors.primaryDark,
              fontSize: 20,
              fontWeight: 'bold',
            }}
          >
            {(item.username || 'U').charAt(0).toUpperCase()}
          </AppText>
        </View>
      </View>

      <View className="flex-1">
        <AppText
          style={{
            color: colors.text,
            fontSize: 16,
            fontWeight: '600',
          }}
        >
          {item.username || 'Unknown User'}
        </AppText>
      </View>

      {creating && <ActivityIndicator size="small" color={colors.secondary} />}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View className="flex-1 pt-10" style={{ backgroundColor: colors.primary }}>
        <View
          className="flex-row justify-between items-center pt-6 pb-4 px-5"
          style={{ backgroundColor: colors.primary }}
        >
          <TouchableOpacity onPress={handleBack}>
            <AppText style={{ color: colors.secondary, fontSize: 16, fontWeight: '600' }}>
              ← Back
            </AppText>
          </TouchableOpacity>
          <AppText style={{ color: colors.text, fontSize: 24, fontWeight: 'bold' }}>
            New Conversation
          </AppText>
          <View className="w-[50px]" />
        </View>

        <View className="flex-1 justify-center items-center px-5">
          <ActivityIndicator color={colors.secondary} size="large" />
          <AppText className="mt-4" style={{ color: colors.text }}>
            Loading users...
          </AppText>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 pt-10" style={{ backgroundColor: colors.primary }}>
      <View
        className="flex-row justify-between items-center pt-6 pb-4 px-5"
        style={{ backgroundColor: colors.primary }}
      >
        <TouchableOpacity onPress={handleBack}>
          <AppText style={{ color: colors.secondary, fontSize: 16, fontWeight: '600' }}>
            ← Back
          </AppText>
        </TouchableOpacity>
        <AppText style={{ color: colors.text, fontSize: 24, fontWeight: 'bold' }}>
          New Conversation
        </AppText>
        <View className="w-[50px]" />
      </View>

      <View className="px-5 mb-4">
        <TextInput
          className="h-14 rounded-xl px-4 border"
          style={{
            backgroundColor: `${colors.primaryDark}33`,
            color: colors.text,
            borderColor: `${colors.primaryDark}66`,
            fontSize: 16,
          }}
          placeholder="Search users..."
          placeholderTextColor={`${colors.text}66`}
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>

      {filteredUsers.length === 0 ? (
        <View className="flex-1 justify-center items-center px-5">
          <AppText className="text-center" style={{ color: colors.text }}>
            {searchText.trim() ? 'No users found' : 'Search for a user to start a chat'}
          </AppText>
        </View>
      ) : (
        <FlatList
          data={filteredUsers}
          keyExtractor={(item) => item.user_id.toString()}
          renderItem={renderUserItem}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
        />
      )}
    </View>
  );
}
