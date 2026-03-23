import React, { useState } from 'react';
import { View, TouchableOpacity, Alert } from 'react-native';
import { storage } from '../utils/storage';
import { useNavigation } from '@react-navigation/native';
import { authService } from '../services/auth.service';
import { logoutUser } from '../utils/auth';
import { profileSettingsStyles as styles } from '../styles/profileSettings.styles';
import AppText from '../components/UI/textWrapper';
import AppTextInput from '../components/UI/textInputWrapper';
import { useTheme } from '../context/ThemeContext';

export default function UpdateEmailScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const [oldEmail, setOldEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newEmail, setNewEmail] = useState('');

  const handleUpdate = async () => {
    if (!oldEmail.trim() || !password.trim() || !newEmail.trim()) {
      Alert.alert('Error', 'All fields are required');
      return;
    }

    if (oldEmail === newEmail) {
      Alert.alert('Error', 'New email must be different from old email');
      return;
    }

    try {
      const token = await storage.getToken();
      if (!token) {
        Alert.alert('Error', 'Not authenticated.');
        return;
      }

      await authService.updateEmail(newEmail, token);

      Alert.alert(
        'Email Updated',
        'Your email has been changed. You will be logged out for security reasons.',
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
      console.error(err);
      Alert.alert('Error', err.message || 'Failed to update email.');
    }
  };

  return (
    <View
      className="flex-1 pt-16 px-10"
      style={[styles.container, { backgroundColor: colors.primary }]}
    >
      {/* Back Button */}
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <AppText style={[styles.backText, { color: colors.text }]}>Back</AppText>
      </TouchableOpacity>

      <AppText style={[styles.title, { color: colors.text }]}>Update Email</AppText>

      <AppTextInput
        style={[styles.input, { borderColor: colors.primaryDark, color: colors.text }]}
        value={oldEmail}
        onChangeText={setOldEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        placeholder="Current email"
        placeholderTextColor={colors.placeholderText}
      />

      <AppTextInput
        style={[styles.input, { borderColor: colors.primaryDark, color: colors.text }]}
        value={password}
        onChangeText={setPassword}
        autoCapitalize="none"
        placeholder="Current password"
        placeholderTextColor={colors.placeholderText}
        secureTextEntry
      />

      <AppTextInput
        style={[styles.input, { borderColor: colors.primaryDark, color: colors.text }]}
        value={newEmail}
        onChangeText={setNewEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        placeholder="New email"
        placeholderTextColor={colors.placeholderText}
      />

      <TouchableOpacity
        style={[styles.button, { backgroundColor: colors.primaryDark }]}
        onPress={handleUpdate}
      >
        <AppText style={[styles.buttonText, { color: colors.text }]}>Save Email</AppText>
      </TouchableOpacity>
    </View>
  );
}
