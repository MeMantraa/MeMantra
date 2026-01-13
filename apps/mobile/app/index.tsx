import React, { useEffect, useState, useRef } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import * as Notifications from 'expo-notifications';
import { ThemeProvider } from '../context/ThemeContext';
import { SavedProvider } from '../context/SavedContext';
import { storage } from '../utils/storage';
import { notificationService } from '../services/notification.service';

// Import screens
import Login from '../screens/login';
import Signup from '../screens/SignUp';
import ProfileScreen from '../screens/ProfileScreen';
import BottomTabNavigator from '../components/bottomTabNavigator';
import UpdateEmailScreen from '../screens/UpdateEmailScreen';
import UpdatePasswordScreen from '../screens/UpdatePasswordScreen';
import FocusScreen from '../screens/focusScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import VerifyCodeScreen from '../screens/VerifyCodeScreen';
import ResetPasswordScreen from '../screens/ResetPasswordScreen';
import ConversationScreen from '../screens/conversationScreen';
import NewConversationScreen from '../screens/NewConversationScreen';
import ShareMantraScreen from '../screens/ShareMantraScreen';
import BookmarkScreen from '../screens/bookmarkScreen';

const Stack = createStackNavigator();

export default function MainNavigator() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const notificationListener = useRef<Notifications.EventSubscription | undefined>(undefined);
  const responseListener = useRef<Notifications.EventSubscription | undefined>(undefined);

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

  // Set up push notifications when user is logged in
  useEffect(() => {
    if (isLoggedIn) {
      const setupNotifications = async () => {
        try {
          const pushToken = await notificationService.setupNotifications();
          if (pushToken) {
            console.log('Push notifications set up successfully');
          }
        } catch (error) {
          console.error('Failed to set up push notifications:', error);
        }
      };

      setupNotifications();
    }
  }, [isLoggedIn]);

  // Set up notification event listeners
  useEffect(() => {
    // This listener is fired whenever a notification is received while the app is foregrounded
    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      console.log('Notification received in foreground:', notification);
      // You can display a custom in-app notification UI here if needed
    });

    // This listener is fired whenever a user taps on or interacts with a notification
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('Notification tapped:', response);

      // Handle notification tap - extract data for deep linking
      const data = response.notification.request.content.data;

      if (data.type === 'reminder' && data.reminderId) {
        // TODO: Navigate to reminder detail or mantra detail
        console.log('Navigate to reminder:', data.reminderId);
      }
    });

    // Cleanup listeners on unmount
    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
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
          <Stack.Screen
            name="ForgotPassword"
            component={ForgotPasswordScreen}
            options={{ headerTitle: 'Forgot Password' }}
          />
          <Stack.Screen
            name="VerifyCode"
            component={VerifyCodeScreen}
            options={{ headerTitle: 'Verify Code' }}
          />
          <Stack.Screen
            name="ResetPassword"
            component={ResetPasswordScreen}
            options={{ headerTitle: 'Reset Password' }}
          />
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
