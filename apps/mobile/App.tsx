import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import MainNavigator from './app/index';
import './global.css';

declare const __DEV__: boolean;

export default function App() {
  // Log the current mode
  console.log('In development mode:', __DEV__);

  useEffect(() => {
    // Only initialize Sentry in production/release mode

    if (__DEV__) {
      console.log('Development mode: Sentry disabled');
    } else {
      console.log('Production mode: Initializing Sentry...');
      import('./sentry').then(({ startPerformanceTracking }) => {
        // Start manual performance tracking
        startPerformanceTracking();
      });
    }
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        <MainNavigator />
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}
