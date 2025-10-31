import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { ThemeProvider } from '../context/ThemeContext';
import { LikesProvider } from '../context/LikedMantrasContext';
import { storage } from '../utils/storage';

// Screens
import Login from '../screens/login';
import Signup from '../screens/SignUp';
import BottomTabNavigator from '../components/bottomTabNavigator';

const Stack = createStackNavigator();

export default function MainNavigator() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await storage.getToken();
        setIsLoggedIn(!!token);
      } catch (err) {
        console.error('Failed to read token from storage', err);
        setIsLoggedIn(false);
      }
    };

    checkAuth();
  }, []);

  // Show loading spinner while checking token
  if (isLoggedIn === null) {
    return (
      <ThemeProvider>
        <LikesProvider>
          <View
            style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: '#ffffff',
            }}
          >
            <ActivityIndicator size="large" color="#6D7E68" testID="loading-indicator" />
          </View>
        </LikesProvider>
      </ThemeProvider>
    );
  }

  // Once auth is known, render navigation
  return (
    <ThemeProvider>
      <LikesProvider>
        <Stack.Navigator
          initialRouteName={isLoggedIn ? 'MainApp' : 'Login'}
          screenOptions={{
            headerShown: false,
          }}
        >
          {/* Main tab navigation (Home, Liked, etc.) */}
          <Stack.Screen name="MainApp" component={BottomTabNavigator} />

          {/* Auth screens */}
          <Stack.Screen name="Login" component={Login} options={{ headerTitle: 'Login' }} />
          <Stack.Screen name="Signup" component={Signup} options={{ headerTitle: 'Signup' }} />
        </Stack.Navigator>
      </LikesProvider>
    </ThemeProvider>
  );
}
