import React, { useState } from 'react';
import { View, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { authService } from '../services/auth.service';
import { storage } from '../utils/storage';
import { logoutUser } from '../utils/auth';
import { profileSettingsStyles as styles } from '../styles/profileSettings.styles';
import AppText from '../components/UI/textWrapper';
import AppTextInput from '../components/UI/textInputWrapper';
import { useTheme } from '../context/ThemeContext';

export default function UpdatePasswordScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const [oldPassword, setOldPassword] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  const handleUpdate = async () => {
    if (!oldPassword.trim()) {
      return Alert.alert('Error', 'Current password is required.');
    }
    if (password.length < 6) {
      return Alert.alert('Error', 'Password must be at least 6 characters.');
    }
    if (password !== confirm) {
      return Alert.alert('Error', 'Passwords do not match.');
    }

    try {
      const token = await storage.getToken();
      if (!token) {
        Alert.alert('Error', 'Not authenticated.');
        return;
      }

      await authService.updatePassword(password, token);

      Alert.alert(
        'Password Updated',
        'Your password has been changed. You will be logged out for security reasons.',
        [
          {
            text: 'OK',
            onPress: () => {
              void logoutUser(navigation as any);
            },
          },
        ],
      );
    } catch (err: any) {
      console.error('Update password error:', err);
      Alert.alert('Error', 'Failed to update password.');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.primary }]}>
      {/* Back Button */}
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <AppText style={[styles.backText, { color: colors.text }]}>Back</AppText>
      </TouchableOpacity>

      <AppText style={[styles.title, { color: colors.text }]}>Update Password</AppText>

      <AppTextInput
        style={[styles.input, { borderColor: colors.primaryDark, color: colors.text }]}
        secureTextEntry
        placeholder="Current password"
        placeholderTextColor={colors.placeholderText}
        value={oldPassword}
        onChangeText={setOldPassword}
      />

      <AppTextInput
        style={[styles.input, { borderColor: colors.primaryDark, color: colors.text }]}
        secureTextEntry
        placeholder="New password"
        placeholderTextColor={colors.placeholderText}
        value={password}
        onChangeText={setPassword}
      />

      <AppTextInput
        style={[styles.input, { borderColor: colors.primaryDark, color: colors.text }]}
        secureTextEntry
        placeholder="Confirm password"
        placeholderTextColor={colors.placeholderText}
        value={confirm}
        onChangeText={setConfirm}
      />

      <TouchableOpacity
        style={[styles.button, { backgroundColor: colors.primaryDark }]}
        onPress={handleUpdate}
      >
        <AppText style={[styles.buttonText, { color: colors.text }]}>Save Password</AppText>
      </TouchableOpacity>
    </View>
  );
}
