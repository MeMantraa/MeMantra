import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { View, TouchableOpacity, Image, Alert } from 'react-native';
import logo from '../assets/logo.png';
import { authService } from '../services/auth.service';
import { useTheme } from '../context/ThemeContext';
import AppTextInput from '../components/UI/textInputWrapper';
import AppText from '../components/UI/textWrapper';

export default function ResetPasswordScreen({ route, navigation }: any) {
  const { email, code } = route.params;
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { colors } = useTheme();

  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (newPassword.trim() !== confirmPassword.trim()) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    try {
      const response = await authService.resetPassword(email, code, newPassword.trim());

      if (response.status === 'success') {
        Alert.alert('Success', 'Your password has been reset successfully!', [
          {
            text: 'OK',
            onPress: () => {
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              });
            },
          },
        ]);
      } else {
        Alert.alert('Error', response.message || 'Failed to reset password');
      }
    } catch (error: any) {
      console.error('Reset password error:', error);
      const errorMessage =
        error.response?.data?.message || 'Failed to reset password. Please try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <View className="flex-1" style={{ backgroundColor: colors.primary }}>
        <View className="flex-1 justify-center items-center p-[24px]">
          <View className="mb-[30px] -mt-[35px] items-center">
            <Image source={logo} className="w-[250px] h-[250px]" resizeMode="contain" />
          </View>

          <View className="w-full max-w-[400px]">
            <AppText className="text-[#ffffff] text-[24px] font-bold text-center mb-[10px]">
              Reset Password
            </AppText>
            <AppText className="text-[#ffffff] text-[14px] text-center mb-[30px] opacity-80">
              Enter your new password below
            </AppText>

            <AppTextInput
              className="bg-[#ffffff] rounded-[12px] p-[16px] text-[16px] mb-[16px] border border-[#e0e0e0]"
              placeholder="New Password"
              placeholderTextColor={colors.placeholderText}
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
              autoCapitalize="none"
              editable={!loading}
            />

            <AppTextInput
              className="bg-[#ffffff] rounded-[12px] p-[16px] text-[16px] mb-[16px] border border-[#e0e0e0]"
              placeholder="Confirm New Password"
              placeholderTextColor={colors.placeholderText}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              autoCapitalize="none"
              editable={!loading}
            />

            <View className="mb-[16px]">
              <AppText className="text-[#ffffff] text-[12px] opacity-70">
                • Password must be at least 8 characters
              </AppText>
            </View>

            <TouchableOpacity
              style={{ backgroundColor: colors.secondary }}
              className="rounded-[30px] p-[14px] items-center mt-[8px]"
              onPress={handleResetPassword}
              disabled={loading}
            >
              <AppText className="text-[#ffffff] text-[18px] font-semibold">
                {loading ? 'Resetting...' : 'Reset Password'}
              </AppText>
            </TouchableOpacity>
          </View>
        </View>
      </View>
      <StatusBar style="auto" />
    </>
  );
}
