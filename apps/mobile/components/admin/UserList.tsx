import React from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { User } from '../../services/user.service';

interface UserListProps {
  users: User[];
  loading: boolean;
  deletingId: number | null;
  onEdit: (user: User) => void;
  onDelete: (userId: number, username: string) => void;
}

export default function UserList({
  users,
  loading,
  deletingId,
  onEdit,
  onDelete,
}: Readonly<UserListProps>) {
  const { colors } = useTheme();

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator color={colors.secondary} />
        <Text className="text-white/80 mt-3">Loading users...</Text>
      </View>
    );
  }

  if (users.length === 0) {
    return (
      <View className="flex-1 items-center justify-center py-16">
        <Text className="text-white/80 text-base text-center">No users available.</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={users}
      keyExtractor={(item) => item.user_id.toString()}
      contentContainerStyle={{ paddingTop: 4, paddingBottom: 24 }}
      renderItem={({ item }) => (
        <View
          className="flex-row items-center rounded-3xl p-4 mb-3"
          style={{ backgroundColor: `${colors.primaryDark}33` }}
        >
          <View className="flex-1 pr-3">
            <Text className="text-white text-lg font-semibold" numberOfLines={1}>
              {item.username}
            </Text>
            <Text className="text-white/80 text-sm mt-1" numberOfLines={1}>
              {item.email}
            </Text>
            {item.auth_provider && (
              <Text className="text-white/60 text-xs mt-1">Provider: {item.auth_provider}</Text>
            )}
          </View>
          <View className="flex-row gap-2">
            <TouchableOpacity
              accessibilityRole="button"
              className="rounded-full px-4 py-2"
              style={{ backgroundColor: colors.secondary }}
              onPress={() => onEdit(item)}
            >
              <Text className="text-base font-semibold" style={{ color: colors.primaryDark }}>
                Edit
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              accessibilityRole="button"
              className="rounded-full px-4 py-2"
              style={{ backgroundColor: '#EF4444' }}
              onPress={() => onDelete(item.user_id, item.username || 'User')}
              disabled={deletingId === item.user_id}
            >
              {deletingId === item.user_id ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-base font-semibold text-white">Delete</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}
    />
  );
}
