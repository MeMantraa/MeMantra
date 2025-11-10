import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, Alert } from 'react-native';
import logo from '../assets/logo.png';
import googleLogo from '../assets/googleLogo.png';
import { authService } from '../services/auth.service';
import { storage } from '../utils/storage';
import { useGoogleAuth } from '../services/google-auth.service';
import { useTheme } from '../context/ThemeContext';

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { colors } = useTheme();

  const { request, response, promptAsync } = useGoogleAuth();

  //redirect if user already logged in
  useEffect(() => {
    const checkIfLoggedIn = async () => {
      const token = await storage.getToken();
      if (token) {
        navigation.reset({
          index: 0,
          routes: [{ name: 'MainApp' }],
        });
      }
    };
    checkIfLoggedIn();
  }, [navigation]);

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

  useEffect(() => {
    handleGoogleResponse();
  }, [response]);

  const handleGoogleResponse = async () => {
    if (response?.type === 'success') {
      const { authentication } = response;
      const idToken = authentication?.idToken;

      if (idToken) {
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
        } catch (error) {
          console.error('Google auth error:', error);
          Alert.alert('Error', 'Google authentication failed');
        } finally {
          setLoading(false);
        }
      }
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await promptAsync();
    } catch (error) {
      console.error('Google sign-in error:', error);
      Alert.alert('Error', 'Failed to initiate Google sign-in');
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
            <TextInput
              className="bg-[#ffffff] rounded-[12px] p-[16px] text-[16px] mb-[16px] border border-[#e0e0e0]"
              placeholder="Email"
              placeholderTextColor={colors.placeholderText}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              editable={!loading}
            />

            <TextInput
              className="bg-[#ffffff] rounded-[12px] p-[16px] text-[16px] mb-[16px] border border-[#e0e0e0]"
              placeholder="Password"
              placeholderTextColor={colors.placeholderText}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              editable={!loading}
            />

            <TouchableOpacity
              style={{ backgroundColor: colors.secondary }}
              className="rounded-[30px] p-[14px] items-center mt-[8px]"
              onPress={handleLogin}
              disabled={loading}
            >
              <Text className="text-[#ffffff] text-[18px] font-semibold">Login</Text>
            </TouchableOpacity>

            <TouchableOpacity className="items-center mt-[20px]" onPress={handleSignUp}>
              <Text className="text-[#fff] text-[14px]">
                New to us?
                <Text className="text-[#ffffff] text-[14px] font-bold"> Sign Up</Text>
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="bg-[#6D7E68] rounded-[30px] p-[12px] mx-[60px] items-center mt-[18px]"
              onPress={handleGoogleSignIn}
              disabled={!request || loading}
              style={{ backgroundColor: colors.primaryDark }}
            >
              <View className="flex-row items-center">
                <Image source={googleLogo} className="mr-[10px] w-[30px] h-[30px]" />
                <Text className="text-[#fff] text-[14px]">Sign In with Google</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>
      <StatusBar style="auto" />
    </>
  );
}
