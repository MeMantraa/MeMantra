import React from 'react';
import { View, Text } from 'react-native';
import { TouchableOpacity } from 'react-native';
import AppText from '../components/UI/textWrapper';
import { profileSettingsStyles as styles } from '../styles/profileSettings.styles';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';

export default function NotificationsScreen() {
  const navigation = useNavigation();
  const { colors } = useTheme();

  return (
    <View className="flex-1 pt-16 px-10" style={{ backgroundColor: colors.primary }}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <AppText style={[styles.backText, { color: colors.text }]}>Back</AppText>
      </TouchableOpacity>
      <View className="flex-1 justify-center items-center">
        <AppText className="text-[16px]" style={{ color: colors.text }}>
          Notifications
        </AppText>
      </View>
    </View>
  );
}
