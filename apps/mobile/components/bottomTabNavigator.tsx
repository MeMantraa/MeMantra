import React, { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import HomeScreen from '../screens/HomeScreen';
import AdminScreen from '../screens/AdminScreen';
import CollectionsScreen from '../screens/CollectionScreen';
import ChatScreen from '../screens/ChatScreen';
import JournalScreen from '../screens/JournalScreen';
import { storage } from '../utils/storage';
import { isAdminEmail } from '../utils/admin';
import ProfileScreen from '../screens/ProfileScreen';
import { useTheme } from '../context/ThemeContext';

const Tab = createBottomTabNavigator();

// Tab bar icon components - now receive color as prop
const LibraryTabIcon = ({ focused, color }: { focused: boolean; color: string }) => (
  <Ionicons name={focused ? 'bookmark' : 'bookmark-outline'} size={30} color={color} />
);

const HomeTabIcon = ({ focused, color }: { focused: boolean; color: string }) => (
  <Ionicons name={focused ? 'home' : 'home-outline'} size={30} color={color} />
);

const ProfileTabIcon = ({ focused, color }: { focused: boolean; color: string }) => (
  <Ionicons name={focused ? 'person' : 'person-outline'} size={30} color={color} />
);

const ChatTabIcon = ({ focused, color }: { focused: boolean; color: string }) => (
  <Ionicons name={focused ? 'chatbubbles' : 'chatbubbles-outline'} size={30} color={color} />
);

const JournalTabIcon = ({ focused, color }: { focused: boolean; color: string }) => (
  <Ionicons name={focused ? 'book' : 'book-outline'} size={30} color={color} />
);

const AdminTabIcon = ({ focused, color }: { focused: boolean; color: string }) => (
  <Ionicons name={focused ? 'settings' : 'settings-outline'} size={30} color={color} />
);

export default function BottomTabNavigator() {
  const { colors } = useTheme();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const determineAdminStatus = async () => {
      try {
        const userData = await storage.getUserData();
        if (isMounted) {
          setIsAdmin(isAdminEmail(userData?.email));
        }
      } catch (error) {
        console.error('Failed to determine admin status', error);
        if (isMounted) {
          setIsAdmin(false);
          Alert.alert('Error', 'Failed to load user data. Some features may be unavailable.');
        }
      }
    };
    determineAdminStatus();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={{
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: colors.primaryDark,
          borderTopWidth: 0.5,
          borderTopColor: colors.white,
          height: 105,
          paddingBottom: 12,
          paddingTop: 15,
        },
        tabBarActiveTintColor: colors.white,
        tabBarInactiveTintColor: colors.white,
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Library"
        component={CollectionsScreen}
        options={{
          tabBarIcon: LibraryTabIcon,
        }}
      />
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: HomeTabIcon,
        }}
      />
      <Tab.Screen
        name="Chat"
        component={ChatScreen}
        options={{
          tabBarIcon: ChatTabIcon,
        }}
      />
      <Tab.Screen
        name="Journal"
        component={JournalScreen}
        options={{
          tabBarIcon: JournalTabIcon,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ProfileTabIcon,
        }}
      />
      {isAdmin && (
        <Tab.Screen
          name="Admin"
          component={AdminScreen}
          options={{
            tabBarIcon: AdminTabIcon,
          }}
        />
      )}
    </Tab.Navigator>
  );
}
