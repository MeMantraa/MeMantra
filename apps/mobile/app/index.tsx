import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { ThemeProvider } from '../context/ThemeContext';
import { SavedProvider } from '../context/SavedContext';
import { storage } from '../utils/storage';

// Import screens
import Login from '../screens/login';
import Signup from '../screens/SignUp';
import ProfileScreen from '../screens/ProfileScreen';
import BottomTabNavigator from '../components/bottomTabNavigator';
import UpdateEmailScreen from '../screens/UpdateEmailScreen';
import UpdatePasswordScreen from '../screens/UpdatePasswordScreen';
import FocusScreen from '../screens/focusScreen';
import ConversationScreen from '../screens/conversationScreen';
import NewConversationScreen from '../screens/NewConversationScreen';
import ShareMantraScreen from '../screens/ShareMantraScreen';
import BookmarkScreen from '../screens/bookmarkScreen';

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
      <SavedProvider>
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
          <Stack.Screen name="Profile" component={ProfileScreen} />
          <Stack.Screen name="UpdateEmail" component={UpdateEmailScreen} />
          <Stack.Screen name="UpdatePassword" component={UpdatePasswordScreen} />
          <Stack.Screen name="ShareMantra" component={ShareMantraScreen} />
          <Stack.Screen
            name="Focus"
            component={FocusScreen}
            options={{
              cardStyleInterpolator: ({ current }) => ({
                cardStyle: {
                  opacity: current.progress,
                },
              }),
              transitionSpec: {
                open: { animation: 'timing', config: { duration: 450 } },
                close: { animation: 'timing', config: { duration: 350 } },
              },
            }}
          />

          <Stack.Screen
            name="NewConversation"
            component={NewConversationScreen}
            options={{
              headerShown: false,
            }}
          />

          <Stack.Screen
            name="Conversation"
            component={ConversationScreen}
            options={{
              headerShown: true,
              headerStyle: {
                backgroundColor: '#9AA793',
              },
              headerTintColor: '#ffffff',
              headerTitleStyle: {
                fontFamily: 'LibreBaskerville-Regular',
              },
            }}
          />
          <Stack.Screen
            name="CollectionDetail"
            component={BookmarkScreen}
            options={{
              cardStyleInterpolator: ({ current }) => ({
                cardStyle: {
                  opacity: current.progress,
                },
              }),
              transitionSpec: {
                open: { animation: 'timing', config: { duration: 300 } },
                close: { animation: 'timing', config: { duration: 300 } },
              },
            }}
          />
        </Stack.Navigator>
      </SavedProvider>
    </ThemeProvider>
  );
}
