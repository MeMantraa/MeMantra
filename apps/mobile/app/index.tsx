import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { ThemeProvider } from '../context/ThemeContext';

// Import your screens
import Login from '../components/LogIn';
import Signup from '../components/SignUp';
// Import other screens as needed

const Stack = createStackNavigator();

export default function MainNavigator() {
  return (
    <ThemeProvider>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="Login" component={Login} options={{ headerTitle: 'Login' }} />

        <Stack.Screen name="Signup" component={Signup} options={{ headerTitle: 'Signup' }} />
      </Stack.Navigator>
    </ThemeProvider>
  );
}
