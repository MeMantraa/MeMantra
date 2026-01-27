import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { View, TouchableOpacity, Image, Alert } from 'react-native';
import logo from '../assets/logo.png';
import { authService } from '../services/auth.service';
import { useTheme } from '../context/ThemeContext';
import AppTextInput from '../components/UI/textInputWrapper';
import AppText from '../components/UI/textWrapper';

export default function ForgotPasswordScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { colors } = useTheme();

  const handleSendCode = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    // Basic email validation
    const trimmedEmail = email.trim();
    const atIndex = trimmedEmail.indexOf('@');
    const lastDotIndex = trimmedEmail.lastIndexOf('.');

    if (
      atIndex <= 0 ||
      lastDotIndex <= atIndex + 1 ||
      lastDotIndex >= trimmedEmail.length - 1 ||
      trimmedEmail.includes(' ')
    ) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      const response = await authService.forgotPassword(email.trim().toLowerCase());

      if (response.status === 'success') {
        Alert.alert('Success', response.message, [
          {
            text: 'OK',
            onPress: () => {
              navigation.navigate('VerifyCode', { email: email.trim().toLowerCase() });
            },
          },
        ]);
      } else {
        Alert.alert('Error', response.message || 'Failed to send verification code');
      }
    } catch (error: any) {
      console.error('Forgot password error:', error);
      const errorMessage =
        error.response?.data?.message || 'Failed to send verification code. Please try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigation.navigate('Login');
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
              Forgot Password?
            </AppText>
            <AppText className="text-[#ffffff] text-[14px] text-center mb-[30px] opacity-80">
              Enter your email address and we'll send you a verification code to reset your
              password.
            </AppText>

            <AppTextInput
              className="bg-[#ffffff] rounded-[12px] p-[16px] text-[16px] mb-[16px] border border-[#e0e0e0]"
              placeholder="Email"
              placeholderTextColor={colors.placeholderText}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              editable={!loading}
            />

            <TouchableOpacity
              style={{ backgroundColor: colors.secondary }}
              className="rounded-[30px] p-[14px] items-center mt-[8px]"
              onPress={handleSendCode}
              disabled={loading}
            >
              <AppText className="text-[#ffffff] text-[18px] font-semibold">
                {loading ? 'Sending...' : 'Send Code'}
              </AppText>
            </TouchableOpacity>

            <TouchableOpacity className="items-center mt-[20px]" onPress={handleBackToLogin}>
              <AppText className="text-[#fff] text-[14px]">
                Remember your password?
                <AppText className="text-[#ffffff] text-[14px] font-bold"> Back to Login</AppText>
              </AppText>
            </TouchableOpacity>
          </View>
        </View>
      </View>
      <StatusBar style="auto" />
    </>
  );
}
