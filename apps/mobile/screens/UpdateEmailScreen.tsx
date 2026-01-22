import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Alert } from 'react-native';
import { storage } from '../utils/storage';
import { useNavigation } from '@react-navigation/native';
import { authService } from '../services/auth.service';
import { logoutUser } from '../utils/auth';
import { profileSettingsStyles as styles } from '../styles/profileSettings.styles';
import AppText from '../components/UI/textWrapper';
import AppTextInput from '../components/UI/textInputWrapper';

export default function UpdateEmailScreen() {
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
      const token = await storage.getToken();
      if (!token) {
        Alert.alert('Error', 'Not authenticated.');
        return;
      }

      await authService.updateEmail(email, token);

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
      Alert.alert('Error', err.message || 'Failed to update email.');
    }
  };

  return (
    <View style={styles.container}>
      {/* Back Button */}
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <AppText style={styles.backText}>← Back</AppText>
      </TouchableOpacity>

      <AppText style={styles.title}>Update Email</AppText>

      <AppTextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        placeholder="Enter new email"
        placeholderTextColor="#aaa"
      />

      <TouchableOpacity style={styles.button} onPress={handleUpdate}>
        <AppText style={styles.buttonText}>Save Email</AppText>
      </TouchableOpacity>
    </View>
  );
}
