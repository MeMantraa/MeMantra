import React, { useEffect, useRef, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Animated, AppState, AppStateStatus, Image, StyleSheet } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import MainNavigator from './app/index';
import splashLogo from './assets/logo.png';
import './global.css';
import LibreBaskerville from './assets/fonts/LibreBaskerville-Regular.ttf';
import * as Font from 'expo-font';
import { setNavigationRef } from './services/api.config';
import { engagementService } from './services/engagement.service';

SplashScreen.preventAutoHideAsync();

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);
  const [isSplashVisible, setIsSplashVisible] = useState(true);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const navigationRef = useRef<any>(null);

  useEffect(() => {
    let isMounted = true;

    async function prepare() {
      try {
        await Font.loadAsync({
          'LibreBaskerville-Regular': LibreBaskerville,
        });

        await SplashScreen.hideAsync();
        if (isMounted) {
          setAppIsReady(true);
        }
      } catch (e) {
        console.warn(e);
      }
    }

    prepare();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') engagementService.trackAppOpen();
    });
    return () => sub.remove();
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
      <NavigationContainer
        ref={navigationRef}
        onReady={() => {
          setNavigationRef(navigationRef.current);
        }}
      >
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
