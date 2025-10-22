import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const Tab = createBottomTabNavigator();

// icons def
const LibraryIcon = ({ color }: { color: string }) => (
  <Ionicons name="bookmark-outline" size={28} color={color} />
);

const HomeIcon = ({ color }: { color: string }) => (
  <Ionicons name="home-outline" size={28} color={color} />
);

const LikedIcon = ({ color }: { color: string }) => (
  <Ionicons name="heart-outline" size={28} color={color} />
);

// options def
const libraryOptions = {
  tabBarIcon: ({ color }: { color: string }) => <LibraryIcon color={color} />,
};

const homeOptions = {
  tabBarIcon: ({ color }: { color: string }) => <HomeIcon color={color} />,
};

const likedOptions = {
  tabBarIcon: ({ color }: { color: string }) => <LikedIcon color={color} />,
};

export default function BottomTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: 'white',
        tabBarInactiveTintColor: 'rgba(255,255,255,0.7)',
        headerShown: false,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tab.Screen name="Library" component={LibraryScreen} options={libraryOptions} />
      <Tab.Screen name="Home" component={HomeScreen} options={homeOptions} />
      <Tab.Screen name="Liked" component={LikedScreen} options={likedOptions} />
    </Tab.Navigator>
  );
}

// Placeholder screens
function LibraryScreen() {
  return (
    <View style={styles.screenContainer}>
      <Text>Library Screen</Text>
    </View>
  );
}

function HomeScreen() {
  return (
    <View style={styles.screenContainer}>
      <Text>Home Screen</Text>
    </View>
  );
}

function LikedScreen() {
  return (
    <View style={styles.screenContainer}>
      <Text>Liked Screen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#A8B3A2',
  },
  tabBar: {
    backgroundColor: '#6d7e68',
    borderTopWidth: 0.5,
    borderTopColor: 'white',
    height: 105,
    paddingBottom: 12,
    paddingTop: 8,
  },
  tabLabel: {
    fontFamily: 'Red_Hat_Text-SemiBold',
    fontWeight: '600',
    fontSize: 15,
    marginTop: 4,
  },
});
