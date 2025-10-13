import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import MainNavigator from './app/index';
import './global.css';
import './sentry';

declare var __DEV__: boolean;

export default function App() {
  // Log the current mode
  console.log('In development mode:', __DEV__);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {__DEV__ ? (
        // Development mode no Sentry reports during development
        <NavigationContainer>
          <MainNavigator />
        </NavigationContainer>
      ) : (
        // Production mode Sentry will report real errors
        <NavigationContainer>
          <MainNavigator />
        </NavigationContainer>
      )}
    </GestureHandlerRootView>
  );
}
