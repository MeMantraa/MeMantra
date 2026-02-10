import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Alert } from 'react-native';
import { storage } from '../utils/storage';
import { useNavigation } from '@react-navigation/native';
import { authService } from '../services/auth.service';
import { logoutUser } from '../utils/auth';
import { profileSettingsStyles as styles } from '../styles/profileSettings.styles';
import AppText from '../components/UI/textWrapper';
import AppTextInput from '../components/UI/textInputWrapper';
import { useTheme } from '../context/ThemeContext';
import { usePostHogScreen } from '../utils/posthog';
import { posthog } from '../services/posthog';

export default function UpdateEmailScreen() {
  const { colors } = useTheme();
  usePostHogScreen();
  const navigation = useNavigation();
  const [email, setEmail] = useState('');

  useEffect(() => {
    const load = async () => {
      const userData = await storage.getUserData();
      setEmail(userData?.email || '');
    };
    load();
  }, []);

  const handleUpdate = async () => {
    try {
      posthog.capture('update_email_save_tapped');
      const token = await storage.getToken();
      if (!token) {
        posthog.capture('update_email_not_authenticated');
        Alert.alert('Error', 'Not authenticated.');
        return;
      }

      await authService.updateEmail(email, token);
      posthog.capture('update_email_success');

      Alert.alert(
        'Email Updated',
        'Your email has been changed. You will be logged out for security reasons.',
        [
          {
            text: 'OK',
            onPress: () => {
              void logoutUser(navigation);
            },
          },
        ],
      );
    } catch (err: any) {
      console.error(err);
      posthog.capture('update_email_failed', {
        error_name: err?.name || 'unknown',
        has_message: Boolean(err?.message),
      });
      Alert.alert('Error', err.message || 'Failed to update email.');
    }
  };

  return (
    <View
      className="flex-1 pt-16 px-10"
      style={[styles.container, { backgroundColor: colors.white }]}
    >
      {/* Back Button */}
      <TouchableOpacity
        onPress={() => {
          posthog.capture('update_email_back_pressed');
          navigation.goBack();
        }}
        style={styles.backButton}
      >
        <AppText style={[styles.backText, { color: colors.primaryDark }]}>Back</AppText>
      </TouchableOpacity>

      <AppText style={[styles.title, { color: colors.black }]}>Update Email</AppText>

      <AppTextInput
        style={[styles.input, { borderColor: colors.primary, color: colors.black }]}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        placeholder="Enter new email"
        placeholderTextColor="#aaa"
      />

      <TouchableOpacity
        style={[styles.button, { backgroundColor: colors.settings }]}
        onPress={handleUpdate}
      >
        <AppText style={[styles.buttonText, { color: colors.black }]}>Save Email</AppText>
      </TouchableOpacity>
    </View>
  );
}
