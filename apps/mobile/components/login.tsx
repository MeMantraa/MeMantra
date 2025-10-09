import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image } from 'react-native';
import logo from '../assets/logo.png';
import googleLogo from '../assets/googleLogo.png';

export default function LoginScreen({ navigation }: any) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    console.log('Login pressed', { username, password });
  };

  const handleSignUp = () => {
    navigation.navigate('Signup');
  };

  return (
    <>
      <View className="flex-1 bg-[#9AA793]">
        <View className="flex-1 justify-center items-center p-[24px]">
          <View className="mb-[30px] -mt-[35px] items-center">
            <Image source={logo} className="w-[250px] h-[250px]" resizeMode="contain" />
          </View>

          <View className="w-full max-w-[400px]">
            <TextInput
              className="bg-[#ffffff] rounded-[12px] p-[16px] text-[16px] mb-[16px] border border-[#e0e0e0]"
              placeholder="Username"
              placeholderTextColor="#999"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
            />

            <TextInput
              className="bg-[#ffffff] rounded-[12px] p-[16px] text-[16px] mb-[16px] border border-[#e0e0e0]"
              placeholder="Password"
              placeholderTextColor="#999"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
            />

            <TouchableOpacity
              className="bg-[#E6D29C] rounded-[30px] p-[14px] items-center mt-[8px]"
              onPress={handleLogin}
            >
              <Text className="text-[#ffffff] text-[18px] font-semibold">Login</Text>
            </TouchableOpacity>

            <TouchableOpacity className="items-center mt-[20px]" onPress={handleSignUp}>
              <Text className="text-[#fff] text-[14px]">
                New to us?
                <Text className="text-[#ffffff] text-[14px] font-bold"> Sign Up</Text>
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
      </View>
      <StatusBar style="auto" />
    </>
  );
}
