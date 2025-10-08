import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

// Import your screens
import LoginScreen from '../components/login';
import Signup from '../components/SignUp';
// Import other screens as needed

const Stack = createStackNavigator();

export default function MainNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Login"
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} options={{ headerTitle: 'Login' }} />

      <Stack.Screen name="Signup" component={Signup} options={{ headerTitle: 'Signup' }} />
    </Stack.Navigator>
  );
}
