import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import AppText from '../components/UI/textWrapper';
import { User, userService } from '../services/user.service';
import { chatService } from '../services/chat.service';
import { storage } from '../utils/storage';

export default function NewConversationScreen({ navigation }: any) {
  const { colors } = useTheme();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [searchText, users]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const token = await storage.getToken();
      const response = await userService.getAllUsers(token || '');

      if (response.status === 'success') {
        // Filter out current user since I can't chat with myself
        const currentUserId = await storage.getUserId();
        const otherUsers = response.data.users.filter((user) => user.user_id !== currentUserId);
        setUsers(otherUsers);
      }
    } catch (err) {
      console.error('Error loading users:', err);
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    if (searchText.trim()) {
      const filtered = users.filter(
        (user) =>
          user.username?.toLowerCase().includes(searchText.toLowerCase()) ||
          user.email?.toLowerCase().includes(searchText.toLowerCase()),
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(users);
    }
  };

  const handleUserSelect = async (user: User) => {
    try {
      setCreating(true);
      const token = await storage.getToken();

      const conversation = await chatService.createConversation(
        { participant_id: user.user_id },
        token || '',
      );

      navigation.replace('Conversation', { conversation });
    } catch (err) {
      console.error('Error creating conversation:', err);
      alert('Failed to start conversation. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const renderUserItem = ({ item }: { item: User }) => (
    <TouchableOpacity
      style={[styles.userItem, { backgroundColor: `${colors.primaryDark}33` }]}
      onPress={() => handleUserSelect(item)}
      disabled={creating}
    >
      <View style={styles.avatarContainer}>
        <View style={[styles.avatar, { backgroundColor: colors.secondary }]}>
          <AppText
            style={{
              color: colors.primaryDark,
              fontSize: 20,
              fontWeight: 'bold',
            }}
          >
            {(item.username || item.email || 'U').charAt(0).toUpperCase()}
          </AppText>
        </View>
      </View>

      <View style={styles.userInfo}>
        <AppText
          style={{
            color: colors.text,
            fontSize: 16,
            fontWeight: '600',
          }}
        >
          {item.username || 'Unknown User'}
        </AppText>
        {item.email && (
          <AppText
            style={{
              color: `${colors.text}99`,
              fontSize: 14,
            }}
          >
            {item.email}
          </AppText>
        )}
      </View>

      {creating && <ActivityIndicator size="small" color={colors.secondary} />}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.primary }]}>
        <View style={[styles.header, { backgroundColor: colors.primary }]}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <AppText style={[styles.backButton, { color: colors.secondary }]}>← Back</AppText>
          </TouchableOpacity>
          <AppText style={[styles.headerTitle, { color: colors.text }]}>New Conversation</AppText>
          <View style={{ width: 50 }} />
        </View>

        <View style={styles.centerContainer}>
          <ActivityIndicator color={colors.secondary} size="large" />
          <AppText style={{ color: colors.text, marginTop: 16 }}>Loading users...</AppText>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.primary }]}>
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <AppText style={[styles.backButton, { color: colors.secondary }]}>← Back</AppText>
        </TouchableOpacity>
        <AppText style={[styles.headerTitle, { color: colors.text }]}>New Conversation</AppText>
        <View style={{ width: 50 }} />
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={[
            styles.searchInput,
            {
              backgroundColor: `${colors.primaryDark}33`,
              color: colors.text,
              borderColor: `${colors.primaryDark}66`,
            },
          ]}
          placeholder="Search users..."
          placeholderTextColor={`${colors.text}66`}
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>

      {filteredUsers.length === 0 ? (
        <View style={styles.centerContainer}>
          <AppText style={{ color: colors.text, textAlign: 'center' }}>
            {searchText.trim() ? 'No users found' : 'No users available'}
          </AppText>
        </View>
      ) : (
        <FlatList
          data={filteredUsers}
          keyExtractor={(item) => item.user_id.toString()}
          renderItem={renderUserItem}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  backButton: {
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  searchInput: {
    height: 48,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    borderWidth: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userInfo: {
    flex: 1,
  },
});
