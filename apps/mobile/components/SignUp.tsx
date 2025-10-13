import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, ScrollView, Alert } from 'react-native';
import logo from '../assets/logo.png';
import googleLogo from '../assets/googleLogo.png';
import { authService } from '../services/auth.service';
import { storage } from '../utils/storage';

export default function SignUpScreen({ navigation }: any) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

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

  return (
    <>
      <View className="flex-1 bg-[#9AA793]">
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
          <View className="flex-1 justify-center items-center p-[24px] pt-[60px] pb-[40px]">
            <View className="mb-[20px] items-center">
              <Image source={logo} className="w-[200px] h-[200px]" />
            </View>

            <View className="w-full max-w-[400px]">
              <TextInput
                className="bg-[#fff] rounded-[12px] p-[16px] text-[16px] mb-[16px] border border-[#e0e0e0]"
                placeholder="Username"
                placeholderTextColor="#999"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                editable={!loading}
              />
              <TextInput
                className="bg-[#fff] rounded-[12px] p-[16px] text-[16px] mb-[16px] border border-[#e0e0e0]"
                placeholder="Email"
                placeholderTextColor="#999"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                editable={!loading}
              />
              <TextInput
                className="bg-[#fff] rounded-[12px] p-[16px] text-[16px] mb-[16px] border border-[#e0e0e0]"
                placeholder="Password"
                placeholderTextColor="#999"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                editable={!loading}
              />
              <TextInput
                className="bg-[#fff] rounded-[12px] p-[16px] text-[16px] mb-[16px] border border-[#e0e0e0]"
                placeholder="Confirm Password"
                placeholderTextColor="#999"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                autoCapitalize="none"
                editable={!loading}
              />

              <TouchableOpacity
                className="bg-[#E6D29C] rounded-[30px] p-[14px] items-center mt-[8px]"
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

              <TouchableOpacity className="bg-[#6D7E68] rounded-[30px] p-[12px] mx-[60px] items-center mt-[18px] ">
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
