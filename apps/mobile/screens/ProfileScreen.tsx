import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../src/naviagation/types';
import { logoutUser } from '../utils/auth';
import { storage } from '../utils/storage';
import { authService } from '../services/auth.service';
import React, { useEffect, useState } from 'react';

type ProfileNavProp = StackNavigationProp<RootStackParamList>;

export default function ProfileScreen() {
  const navigation = useNavigation<ProfileNavProp>();
  const [username, setUsername] = useState<string>('');

  useEffect(() => {
    const load = async () => {
      const user = await storage.getUserData();
      setUsername(user?.username || '');
    };
    load();
  }, []);

  const confirmDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you absolutely sure you want to permanently delete your account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteAccount();
          },
        },
      ],
    );
  };
  const deleteAccount = async () => {
    try {
      const token = await storage.getToken();

      if (!token) {
        Alert.alert('Error', 'Not authenticated.');
        return;
      }

      await authService.deleteAccount(token);
      showDeletedAlert();
    } catch (err: any) {
      console.error('Delete account error:', err);
      Alert.alert('Error', err?.response?.data?.message || 'Failed to delete account.');
    }
  };

  const showDeletedAlert = () => {
    Alert.alert('Account Deleted', 'Your account has been deleted. You will now be logged out.', [
      {
        text: 'OK',
        onPress: () => {
          logoutUser(navigation);
        },
      },
    ]);
  };

  const handleLogout = () => logoutUser(navigation);

  return (
    <View style={styles.container}>
      <Text style={styles.name}>{username}</Text>

      <View style={styles.optionsContainer}>
        <ProfileOption label="Update Email" onPress={() => navigation.navigate('UpdateEmail')} />
        <ProfileOption
          label="Update Password"
          onPress={() => navigation.navigate('UpdatePassword')}
        />
        <ProfileOption
          label="Notification Settings"
          onPress={() => navigation.navigate('NotificationSettings')}
        />
        <ProfileOption label="Delete Account" onPress={confirmDeleteAccount} destructive />
        <ProfileOption label="Sign Out" onPress={handleLogout} />
      </View>
    </View>
  );
}

function ProfileOption({
  label,
  onPress,
  destructive = false,
}: {
  label: string;
  onPress: () => void;
  destructive?: boolean;
}) {
  return (
    <TouchableOpacity style={styles.option} onPress={onPress}>
      <Text style={[styles.optionText, destructive && styles.destructiveText]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#A8B3A2',
    paddingTop: 70,
    paddingHorizontal: 20,
  },
  name: {
    fontSize: 34,
    fontWeight: '700',
    fontFamily: 'Red_Hat_Text-Bold',
    color: 'white',
    marginBottom: 40,
    textAlign: 'center',
  },
  optionsContainer: {
    marginTop: 20,
    gap: 20,
  },
  option: {
    backgroundColor: '#ffffff',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  optionText: {
    fontSize: 18,
    fontFamily: 'Red_Hat_Text-SemiBold',
    color: '#333',
  },
  destructiveText: {
    color: '#b30000',
  },
});
