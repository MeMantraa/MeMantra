import React, { useEffect, useRef, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Animated, Image, StyleSheet } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import MainNavigator from './app/index';
import splashLogo from './assets/logo.png';
import './global.css';

declare const __DEV__: boolean;

SplashScreen.preventAutoHideAsync();

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);
  const [isSplashVisible, setIsSplashVisible] = useState(true);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let isMounted = true;

    async function prepare() {
      try {
        console.log('In development mode:', __DEV__);
        if (__DEV__) {
          console.log('Development mode: Sentry disabled');
        } else {
          console.log('Production mode: Initializing Sentry...');
          const { startPerformanceTracking } = await import('./sentry');
          startPerformanceTracking();
        }
      } catch (e) {
        console.warn(e);
      } finally {
        await SplashScreen.hideAsync();
        if (isMounted) {
          setAppIsReady(true);
        }
      }
    }

    prepare();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!appIsReady) return;

    let isMounted = true;
    const animation = Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 500,
      useNativeDriver: true,
    });

    animation.start(() => {
      if (isMounted) {
        setIsSplashVisible(false);
      }
    });

    return () => {
      isMounted = false;
      animation.stop();
    };
  }, [appIsReady, fadeAnim]);

  return (
    <GestureHandlerRootView style={styles.container}>
      <NavigationContainer>
        <MainNavigator />
      </NavigationContainer>
      {isSplashVisible && (
        <Animated.View style={[styles.splashOverlay, { opacity: fadeAnim }]} pointerEvents="none">
          <Image source={splashLogo} style={styles.splashImage} resizeMode="contain" />
        </Animated.View>
      )}
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  splashOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#8E9A86',
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashImage: {
    width: 200,
    height: 200,
  },
});
