import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { ThemeProvider } from '../context/ThemeContext';
import { storage } from '../utils/storage';

// Import your screens
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

  if (isLoggedIn === null) {
    return (
      <ThemeProvider>
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
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <Stack.Navigator
        initialRouteName={isLoggedIn ? 'MainApp' : 'Login'}
        screenOptions={{
          headerShown: false,
        }}
      >
        {/* Always register MainApp so Login can navigate to it */}
        <Stack.Screen name="MainApp" component={BottomTabNavigator} />
        <Stack.Screen name="Login" component={Login} options={{ headerTitle: 'Login' }} />
        <Stack.Screen name="Signup" component={Signup} options={{ headerTitle: 'Signup' }} />
      </Stack.Navigator>
    </ThemeProvider>
  );
}
