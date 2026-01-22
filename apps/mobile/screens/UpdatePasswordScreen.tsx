import React, { useState } from 'react';
import { View, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { authService } from '../services/auth.service';
import { storage } from '../utils/storage';
import { logoutUser } from '../utils/auth';
import { profileSettingsStyles as styles } from '../styles/profileSettings.styles';
import AppText from '../components/UI/textWrapper';
import AppTextInput from '../components/UI/textInputWrapper';

export default function UpdatePasswordScreen() {
  const navigation = useNavigation();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  const handleUpdate = async () => {
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
    <View style={styles.container}>
      {/* Back Button */}
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <AppText style={styles.backText}>← Back</AppText>
      </TouchableOpacity>

      <AppText style={styles.title}>Update Password</AppText>

      <AppTextInput
        style={styles.input}
        secureTextEntry
        placeholder="New password"
        placeholderTextColor="#aaa"
        value={password}
        onChangeText={setPassword}
      />

      <AppTextInput
        style={styles.input}
        secureTextEntry
        placeholder="Confirm password"
        placeholderTextColor="#aaa"
        value={confirm}
        onChangeText={setConfirm}
      />

      <TouchableOpacity style={styles.button} onPress={handleUpdate}>
        <AppText style={styles.buttonText}>Save Password</AppText>
      </TouchableOpacity>
    </View>
  );
}
