import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import {
  View,
  TouchableOpacity,
  Image,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
} from 'react-native';
import logo from '../assets/logo.png';
import { authService } from '../services/auth.service';
import { storage } from '../utils/storage';
import { notificationService } from '../services/notification.service';
import { useTheme } from '../context/ThemeContext';
import AppTextInput from '../components/UI/textInputWrapper';
import AppText from '../components/UI/textWrapper';

export default function CompleteSignUpScreen({ route, navigation }: any) {
  const { email, code } = route.params;
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { colors } = useTheme();

  const handleCompleteSignUp = async () => {
    if (!username || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (username.trim().length < 3) {
      Alert.alert('Error', 'Username must be at least 3 characters');
      return;
    }

    if (password.trim() !== confirmPassword.trim()) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    try {
      const response = await authService.register({
        username: username.trim(),
        email,
        password: password.trim(),
        code,
      });

      if (response.status === 'success') {
        await storage.saveToken(response.data.token);
        await storage.saveUserData(response.data.user);

        // Register for push notifications now that we're authenticated
        notificationService.setupNotifications().catch((err) => {
          console.error('Failed to set up push notifications after signup:', err);
          Alert.alert(
            'Notifications',
            'Could not enable push notifications. You can enable them later in Settings.',
          );
        });

        navigation.reset({
          index: 0,
          routes: [{ name: 'MainApp' }],
        });
      }
    } catch (error: any) {
      console.error('Complete sign up error:', error);
      const errorMessage = error.response?.data?.message || 'Sign up failed. Please try again.';

      // If the code expired between verify and complete, send them back to re-verify
      if (error.response?.status === 400 && errorMessage.includes('verification code')) {
        Alert.alert(
          'Code Expired',
          'Your verification code has expired. Please verify your email again.',
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('VerifyCode', { email, flow: 'signup' }),
            },
          ],
        );
      } else {
        Alert.alert('Sign Up Failed', errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <KeyboardAvoidingView
        className="flex-1"
        behavior="padding"
        style={{ backgroundColor: colors.primary }}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View className="flex-1 justify-center items-center p-[24px] pt-[60px] pb-[40px]">
            <View className="mb-[20px] items-center">
              <Image source={logo} className="w-[200px] h-[200px]" />
            </View>

            <View className="w-full max-w-[400px]">
              <AppText className="text-[#ffffff] text-[24px] font-bold text-center mb-[10px]">
                Almost there!
              </AppText>
              <AppText className="text-[#ffffff] text-[14px] text-center mb-[30px] opacity-80">
                Complete your profile to finish creating your account.
              </AppText>

              {/* Email — shown but locked */}
              <AppTextInput
                className="rounded-[12px] p-[16px] text-[16px] mb-[16px] border border-[#e0e0e0]"
                style={{ backgroundColor: '#e8e8e8', color: '#888888' }}
                placeholder="Email"
                placeholderTextColor={colors.placeholderText}
                value={email}
                editable={false}
                autoCapitalize="none"
                keyboardType="email-address"
              />

              <AppTextInput
                className="bg-[#ffffff] rounded-[12px] p-[16px] text-[16px] mb-[16px] border border-[#e0e0e0]"
                placeholder="Username"
                placeholderTextColor={colors.placeholderText}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                editable={!loading}
              />

              <AppTextInput
                className="bg-[#ffffff] rounded-[12px] p-[16px] text-[16px] mb-[16px] border border-[#e0e0e0]"
                placeholder="Password"
                placeholderTextColor={colors.placeholderText}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                editable={!loading}
              />

              <AppTextInput
                className="bg-[#ffffff] rounded-[12px] p-[16px] text-[16px] mb-[16px] border border-[#e0e0e0]"
                placeholder="Confirm Password"
                placeholderTextColor={colors.placeholderText}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                autoCapitalize="none"
                editable={!loading}
              />

              <TouchableOpacity
                style={{ backgroundColor: colors.secondary }}
                className="rounded-[30px] p-[14px] items-center mt-[8px]"
                onPress={handleCompleteSignUp}
                disabled={loading}
              >
                <AppText className="text-[#ffffff] text-[18px] font-semibold">
                  {loading ? 'Creating Account...' : 'Create Account'}
                </AppText>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <StatusBar style="auto" />
    </>
  );
}
