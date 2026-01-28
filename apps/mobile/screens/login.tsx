import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { View, Image, Alert } from 'react-native';
import logo from '../assets/logo.png';
import { authService } from '../services/auth.service';
import { storage } from '../utils/storage';
import { useTheme } from '../context/ThemeContext';
import AppTextInput from '../components/UI/textInputWrapper';
import AppText from '../components/UI/textWrapper';
import TextButton from '../components/UI/textButton';

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { colors } = useTheme();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    setLoading(true);
    try {
      const response = await authService.login({
        email: email.trim().toLowerCase(),
        password: password.trim(),
      });

      if (response.status === 'success') {
        await storage.saveToken(response.data.token);
        await storage.saveUserData(response.data.user);

        navigation.reset({
          index: 0,
          routes: [{ name: 'MainApp' }],
        });
      } else {
        Alert.alert('Login Failed', response.message || 'Please try again.');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      const errorMessage = error.response?.data?.message || 'Login failed. Please try again.';
      Alert.alert('Login Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = () => {
    navigation.navigate('Signup');
  };

  return (
    <>
      <View className="flex-1" style={{ backgroundColor: colors.primary }}>
        <View className="flex-1 justify-center items-center p-[24px]">
          <View className="mb-[30px] -mt-[35px] items-center">
            <Image source={logo} className="w-[250px] h-[250px]" resizeMode="contain" />
          </View>

          <View className="w-full max-w-[400px]">
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

            <TextButton
              onPress={handleLogin}
              className="rounded-[30px] p-[14px] items-center mt-[8px]"
              textClassName="text-[#fff] text-[18px]"
              style={{ backgroundColor: colors.secondary }}
              disabled={loading}
            >
              Login
            </TextButton>

            <TextButton
              className="mt-[16px] items-center"
              onPress={() => navigation.navigate('ForgotPassword')}
              textClassName="text-[#ffffff] text-[14px] underline"
              disabled={loading}
            >
              Forgot Password?
            </TextButton>

            <TextButton
              className="mt-[16px] items-center mb-[30px]"
              onPress={handleSignUp}
              textClassName="text-[#fff] text-[14px]"
              disabled={loading}
            >
              New to us? <AppText className="text-white font-black">Sign Up</AppText>
            </TextButton>
          </View>
        </View>
      </View>
      <StatusBar style="auto" />
    </>
  );
}
