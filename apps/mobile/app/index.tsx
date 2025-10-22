import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { ThemeProvider } from '../context/ThemeContext';

// Import your screens
import Login from '../screens/login';
import Signup from '../screens/SignUp';
import BottomTabNavigator from '../components/bottomTabNavigator';

const Stack = createStackNavigator();

const useAuth = () => {
  const [isLoggedIn, setIsLoggedIn] = React.useState(true);

  return { isLoggedIn, setIsLoggedIn };
};

export default function MainNavigator() {
  const { isLoggedIn } = useAuth();

  return (
    <ThemeProvider>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        {isLoggedIn ? (
          <Stack.Screen name="MainApp" component={BottomTabNavigator} />
        ) : (
          <>
            <Stack.Screen name="Login" component={Login} options={{ headerTitle: 'Login' }} />
            <Stack.Screen name="Signup" component={Signup} options={{ headerTitle: 'Signup' }} />
          </>
        )}
      </Stack.Navigator>
    </ThemeProvider>
  );
}
