import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { View, TouchableOpacity, Image, Alert } from 'react-native';
import logo from '../../assets/logo.png';
import { useTheme } from '../../context/ThemeContext';
import { isValidEmail } from '../../utils/validation';
import AppTextInput from './textInputWrapper';
import AppText from './textWrapper';

interface EmailFormScreenProps {
  title: string;
  subtitle: string;
  onSubmit: (email: string) => Promise<void>;
  bottomLinkText: string;
  bottomLinkLabel: string;
  onBottomLinkPress: () => void;
}

export default function EmailFormScreen({
  title,
  subtitle,
  onSubmit,
  bottomLinkText,
  bottomLinkLabel,
  onBottomLinkPress,
}: EmailFormScreenProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { colors } = useTheme();

  const handleSubmit = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    const trimmedEmail = email.trim().toLowerCase();

    if (!isValidEmail(trimmedEmail)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      await onSubmit(trimmedEmail);
    } catch (error: any) {
      console.error('Email form error:', error);
      const errorMessage =
        error.response?.data?.message || 'Failed to send verification code. Please try again.';
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
              {title}
            </AppText>
            <AppText className="text-[#ffffff] text-[14px] text-center mb-[30px] opacity-80">
              {subtitle}
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
              onPress={handleSubmit}
              disabled={loading}
            >
              <AppText className="text-[#ffffff] text-[18px] font-semibold">
                {loading ? 'Sending...' : 'Send Code'}
              </AppText>
            </TouchableOpacity>

            <TouchableOpacity
              className="items-center mt-[20px]"
              onPress={onBottomLinkPress}
              disabled={loading}
            >
              <AppText className="text-[#ffffff] text-[14px]">
                {bottomLinkText}
                <AppText className="text-[#ffffff] text-[14px] font-bold">
                  {' '}
                  {bottomLinkLabel}
                </AppText>
              </AppText>
            </TouchableOpacity>
          </View>
        </View>
      </View>
      <StatusBar style="auto" />
    </>
  );
}
