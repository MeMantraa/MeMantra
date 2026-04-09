import React, { useState, useEffect, useCallback } from 'react';
import { View, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import AppText from '../components/UI/textWrapper';
import { userBlockService } from '../services/moderation.service';
import { storage } from '../utils/storage';
import { Ionicons } from '@expo/vector-icons';

interface BlockedUser {
  user_id: number;
  username: string;
  blocked_at: string;
}

export default function BlockedUsersScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBlockedUsers = useCallback(async () => {
    try {
      setLoading(true);
      const token = await storage.getToken();
      const response = await userBlockService.getBlockedUsers(token || '');
      setBlockedUsers(response.data?.blockedUsers || []);
    } catch (err) {
      console.error('Error fetching blocked users:', err);
      Alert.alert('Error', 'Failed to load blocked users.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBlockedUsers();
  }, [fetchBlockedUsers]);

  const handleUnblock = (user: BlockedUser) => {
    Alert.alert('Unblock User', `Are you sure you want to unblock ${user.username}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Unblock',
        onPress: async () => {
          try {
            const token = await storage.getToken();
            await userBlockService.unblockUser(user.user_id, token || '');
            Alert.alert('Unblocked', `${user.username} has been unblocked.`);
            fetchBlockedUsers();
          } catch (err) {
            console.error('Error unblocking user:', err);
            Alert.alert('Error', 'Failed to unblock user. Please try again.');
          }
        },
      },
    ]);
  };

  return (
    <View className="flex-1 pt-16 px-4" style={{ backgroundColor: colors.primary }}>
      {/* Header */}
      <View className="flex-row items-center justify-center relative mb-6 px-2">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="absolute left-0 p-1"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>

        <AppText className="text-2xl font-semibold" style={{ color: colors.white }}>
          Blocked Users
        </AppText>
      </View>

      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={colors.white} />
        </View>
      ) : blockedUsers.length === 0 ? (
        <View className="flex-1 justify-center items-center">
          <AppText style={{ color: colors.text }} className="text-center">
            No blocked users
          </AppText>
        </View>
      ) : (
        <FlatList
          data={blockedUsers}
          keyExtractor={(item) => item.user_id.toString()}
          contentContainerStyle={{ paddingBottom: 32 }}
          renderItem={({ item }) => (
            <View
              className="flex-row items-center justify-between px-5 py-4 rounded-[18px] mb-3"
              style={{ backgroundColor: colors.primaryDark }}
            >
              <AppText className="text-[16px] font-semibold" style={{ color: colors.text }}>
                {item.username}
              </AppText>
              <TouchableOpacity
                onPress={() => handleUnblock(item)}
                className="px-4 py-2 rounded-full"
                style={{ backgroundColor: colors.error }}
              >
                <AppText className="text-sm font-semibold" style={{ color: colors.white }}>
                  Unblock
                </AppText>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </View>
  );
}
