import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, ScrollView, Alert } from 'react-native';
import logo from '../assets/logo.png';
import googleLogo from '../assets/googleLogo.png';
import { authService } from '../services/auth.service';
import { storage } from '../utils/storage';
import { useGoogleAuth } from '../services/google-auth.service';
import { useTheme } from '../context/ThemeContext';

export default function SignUpScreen({ navigation }: any) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const { request, response, promptAsync } = useGoogleAuth();
  const { colors } = useTheme();

  const handleSignUp = async () => {
    if (!username || !email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
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
        email: email.trim().toLowerCase(),
        password: password.trim(),
      });

      if (response.status === 'success') {
        //save token and data
        await storage.saveToken(response.data.token);
        await storage.saveUserData(response.data.user);

        Alert.alert('Success', 'Account created successfully!', [
          {
            text: 'OK',
            onPress: () => {
              //navigate home
            },
          },
        ]);
      }
    } catch (error: any) {
      console.error('Sign up error:', error);
      const errorMessage = error.response?.data?.message || 'Sign up failed. Please try again.';
      Alert.alert('Sign Up Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleLoginRedirect = () => {
    navigation.navigate('Login');
  };

  //Google response
  const handleGoogleResponse = useCallback(async () => {
    if (response?.type === 'success') {
      const idToken = response.authentication?.idToken;
      if (!idToken) return;

      setLoading(true);
      try {
        const authResponse = await authService.googleAuth({ idToken });
        if (authResponse.status === 'success') {
          await storage.saveToken(authResponse.data.token);
          await storage.saveUserData(authResponse.data.user);

          navigation.reset({
            index: 0,
            routes: [{ name: 'MainApp' }],
          });
        } else {
          Alert.alert('Error', authResponse.message || 'Google login failed');
        }
      } catch (error: any) {
        console.error('Google auth error:', error);
        Alert.alert('Error', 'Google authentication failed');
      } finally {
        setLoading(false);
      }
    }
  }, [response, navigation]);

  useEffect(() => {
    handleGoogleResponse();
  }, [response, handleGoogleResponse]);

  //Google sign-up
  const handleGoogleSignUp = async () => {
    try {
      await promptAsync();
    } catch (error) {
      console.error('Google sign-up error:', error);
      Alert.alert('Error', 'Failed to initiate Google sign-up');
    }
  };

  return (
    <>
      <View className="flex-1" style={{ backgroundColor: colors.primary }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
          <View className="flex-1 justify-center items-center p-[24px] pt-[60px] pb-[40px]">
            <View className="mb-[20px] items-center">
              <Image source={logo} className="w-[200px] h-[200px]" />
            </View>

            <View className="w-full max-w-[400px]">
              <TextInput
                className="bg-[#fff] rounded-[12px] p-[16px] text-[16px] mb-[16px] border border-[#e0e0e0]"
                placeholder="Username"
                placeholderTextColor={colors.placeholderText}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                editable={!loading}
              />
              <TextInput
                className="bg-[#fff] rounded-[12px] p-[16px] text-[16px] mb-[16px] border border-[#e0e0e0]"
                placeholder="Email"
                placeholderTextColor={colors.placeholderText}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                editable={!loading}
              />
              <TextInput
                className="bg-[#fff] rounded-[12px] p-[16px] text-[16px] mb-[16px] border border-[#e0e0e0]"
                placeholder="Password"
                placeholderTextColor={colors.placeholderText}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                editable={!loading}
              />
              <TextInput
                className="bg-[#fff] rounded-[12px] p-[16px] text-[16px] mb-[16px] border border-[#e0e0e0]"
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
                onPress={handleSignUp}
              >
                <Text className="text-[#fff] text-[18px] font-semibold">Sign Up</Text>
              </TouchableOpacity>

              <TouchableOpacity className="items-center mt-[20px]" onPress={handleLoginRedirect}>
                <Text className="text-[#fff] text-[14px]">
                  Already have an account?
                  <Text className="text-[#fff] text-[14px] font-bold"> Login</Text>
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="bg-[#6D7E68] rounded-[30px] p-[12px] mx-[60px] items-center mt-[18px]"
                onPress={handleGoogleSignUp}
                disabled={!request || loading}
                style={{ backgroundColor: colors.primaryDark }}
              >
                <View className="flex-row items-center">
                  <Image source={googleLogo} className="mr-[10px] w-[30px] h-[30px]" />
                  <Text className="text-[#fff] text-[14px]">Sign Up with Google</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
      <StatusBar style="auto" />
    </>
  );
}
