import { storage } from '../utils/storage';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../src/navigation/types';
import { useTheme } from '../context/ThemeContext';
import React, { useEffect, useState } from 'react';
import { View, TouchableOpacity } from 'react-native';
import AppText from '../components/UI/textWrapper';
import { profileSettingsStyles as styles } from '../styles/profileSettings.styles';
import { Ionicons } from '@expo/vector-icons';

type ProfileNavProp = StackNavigationProp<RootStackParamList>;

export default function ProfileScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<ProfileNavProp>();
  const [username, setUsername] = useState<string>('');

  useEffect(() => {
    const load = async () => {
      const user = await storage.getUserData();
      setUsername(user?.username || '');
    };
    load();
  }, []);

  return (
    <View className="flex-1 pt-16 px-10" style={{ backgroundColor: colors.primary }}>
      <AppText className="text-[30px] text-left mb-10 mt-2" style={{ color: colors.text }}>
        {username}
      </AppText>
      <AppText className="text-[16px] text-center pt-16" style={{ color: colors.text }}>
        Profile Photo Goes Here
      </AppText>
      <View className="pt-10 mt-20 mb-10 gap-2.5">
        <TouchableOpacity
          className="flex-row justify-between"
          style={[styles.button, { backgroundColor: colors.primaryDark }]}
          onPress={() => navigation.navigate('Reminders')}
        >
          <AppText className="text-[16px] pt-0.5" style={{ color: colors.text }}>
            Reminders
          </AppText>
          <Ionicons name="chevron-forward" size={24} color={colors.white} />
        </TouchableOpacity>
        <TouchableOpacity
          className="flex-row justify-between"
          style={[styles.button, { backgroundColor: colors.primaryDark }]}
          onPress={() => navigation.navigate('NotificationSettings')}
        >
          <AppText className="text-[16px] pt-0.5" style={{ color: colors.text }}>
            Notifications
          </AppText>
          <Ionicons name="chevron-forward" size={24} color={colors.white} />
        </TouchableOpacity>
        <TouchableOpacity
          className="flex-row justify-between"
          style={[styles.button, { backgroundColor: colors.primaryDark }]}
          onPress={() => navigation.navigate('Liked')}
        >
          <AppText className="text-[16px] pt-0.5" style={{ color: colors.text }}>
            Liked
          </AppText>
          <Ionicons name="chevron-forward" size={24} color={colors.white} />
        </TouchableOpacity>
        <TouchableOpacity
          className="flex-row justify-between"
          style={[styles.button, { backgroundColor: colors.primaryDark }]}
          onPress={() => navigation.navigate('MantraAlgorithm')}
        >
          <AppText className="text-[16px] pt-0.5" style={{ color: colors.text }}>
            Mantra Algorithm
          </AppText>
          <Ionicons name="chevron-forward" size={24} color={colors.white} />
        </TouchableOpacity>
        <TouchableOpacity
          className="flex-row justify-between"
          style={[styles.button, { backgroundColor: colors.primaryDark }]}
          onPress={() => navigation.navigate('Themes')}
        >
          <AppText className="text-[16px] pt-0.5" style={{ color: colors.text }}>
            Themes
          </AppText>
          <Ionicons name="chevron-forward" size={24} color={colors.white} />
        </TouchableOpacity>
        <TouchableOpacity
          className="flex-row justify-between"
          style={[styles.button, { backgroundColor: colors.primaryDark }]}
          onPress={() => navigation.navigate('Settings')}
        >
          <AppText className="text-[16px] pt-0.5" style={{ color: colors.text }}>
            Settings
          </AppText>
          <Ionicons name="chevron-forward" size={24} color={colors.white} />
        </TouchableOpacity>
      </View>
    </View>
  );
}
