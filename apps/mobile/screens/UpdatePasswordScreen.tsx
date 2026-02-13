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
              void logoutUser(navigation);
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
    <View style={[styles.container, { backgroundColor: colors.white }]}>
      {/* Back Button */}
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <AppText style={[styles.backText, { color: colors.primaryDark }]}>Back</AppText>
      </TouchableOpacity>

      <AppText style={[styles.title, { color: colors.black }]}>Update Password</AppText>

      <AppTextInput
        style={[styles.input, { borderColor: colors.primary }]}
        secureTextEntry
        placeholder="Current password"
        placeholderTextColor="#aaa"
        value={oldPassword}
        onChangeText={setOldPassword}
      />

      <AppTextInput
        style={[styles.input, { borderColor: colors.primary }]}
        secureTextEntry
        placeholder="New password"
        placeholderTextColor="#aaa"
        value={password}
        onChangeText={setPassword}
      />

      <AppTextInput
        style={[styles.input, { borderColor: colors.primary }]}
        secureTextEntry
        placeholder="Confirm password"
        placeholderTextColor="#aaa"
        value={confirm}
        onChangeText={setConfirm}
      />

      <TouchableOpacity
        style={[styles.button, { backgroundColor: colors.settings }]}
        onPress={handleUpdate}
      >
        <AppText style={[styles.buttonText, { color: colors.black }]}>Save Password</AppText>
      </TouchableOpacity>
    </View>
  );
}
