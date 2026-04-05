import React, { useEffect, useRef, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClientProvider } from '@tanstack/react-query';
import { Animated, AppState, AppStateStatus, Image, StyleSheet } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import MainNavigator from './app/index';
import splashLogo from './assets/logo.png';
import './global.css';
import LibreBaskerville from './assets/fonts/LibreBaskerville-Regular.ttf';
import * as Font from 'expo-font';
import { setNavigationRef } from './services/api.config';
import { engagementService } from './services/engagement.service';
import { queryClient } from './hooks/queryClient';

SplashScreen.preventAutoHideAsync();

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);
  const [isSplashVisible, setIsSplashVisible] = useState(true);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const navigationRef = useRef<any>(null);
  const appBootStartRef = useRef<number>(Date.now());
  const routeChangeStartRef = useRef<number>(Date.now());
  const previousRouteRef = useRef<string | null>(null);

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

    engagementService.trackPerformanceEvent({
      kind: 'mobile_screen',
      name: 'app_startup',
      duration_ms: Date.now() - appBootStartRef.current,
      status: 'success',
      screen: 'AppStartup',
      metadata: {
        splash_visible: isSplashVisible,
      },
    });

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
  }, [appIsReady, fadeAnim, isSplashVisible]);

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={styles.container}>
        <NavigationContainer
          ref={navigationRef}
          onReady={() => {
            setNavigationRef(navigationRef.current);
            const initialRoute = navigationRef.current?.getCurrentRoute?.()?.name || null;
            previousRouteRef.current = initialRoute;
            routeChangeStartRef.current = Date.now();
          }}
          onStateChange={() => {
            const currentRoute = navigationRef.current?.getCurrentRoute?.()?.name || null;
            if (!currentRoute) return;

            if (previousRouteRef.current !== currentRoute) {
              const now = Date.now();
              engagementService.trackPerformanceEvent({
                kind: 'mobile_screen',
                name: currentRoute,
                duration_ms: now - routeChangeStartRef.current,
                status: 'success',
                screen: currentRoute,
                metadata: {
                  from_screen: previousRouteRef.current,
                },
              });

              previousRouteRef.current = currentRoute;
              routeChangeStartRef.current = now;
            }
          }}
        >
          {appIsReady && <MainNavigator />}
        </NavigationContainer>
        {isSplashVisible && (
          <Animated.View style={[styles.splashOverlay, { opacity: fadeAnim }]} pointerEvents="none">
            <Image source={splashLogo} style={styles.splashImage} resizeMode="contain" />
          </Animated.View>
        )}
      </GestureHandlerRootView>
    </QueryClientProvider>
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
