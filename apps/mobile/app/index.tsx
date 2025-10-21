import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

// Import your screens
import LoginScreen from '../screens/login';
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
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      {isLoggedIn ? (
        <Stack.Screen name="MainApp" component={BottomTabNavigator} />
      ) : (
        <>
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerTitle: 'Login' }} />
          <Stack.Screen name="Signup" component={Signup} options={{ headerTitle: 'Signup' }} />
        </>
      )}
    </Stack.Navigator>
  );
}
