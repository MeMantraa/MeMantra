import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../src/navigation/types';
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
    <View className="flex-1 bg-[#A8B3A2] pt-[70px] px-5">
      <Text
        className="text-[34px] font-bold text-white mb-10 text-center"
        style={{ fontFamily: 'Red_Hat_Text-Bold' }}
      >
        {username}
      </Text>

      <View className="mt-5 gap-5">
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
    <TouchableOpacity className="bg-white py-[18px] px-5 rounded-xl" onPress={onPress}>
      <Text
        className={`text-[18px] ${destructive ? 'text-[#b30000]' : 'text-[#333]'}`}
        style={{ fontFamily: 'Red_Hat_Text-SemiBold' }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}
