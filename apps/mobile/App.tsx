import React, { useEffect, useRef, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Animated, Image, StyleSheet } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import MainNavigator from './app/index';
import splashLogo from './assets/logo.png';
import './global.css';
import LibreBaskerville from './assets/fonts/LibreBaskerville-Regular.ttf';
import * as Font from 'expo-font';
import { setNavigationRef } from './services/api.config';
import { PostHogProvider } from 'posthog-react-native';
import { posthog } from './services/posthog';

SplashScreen.preventAutoHideAsync();

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);
  const [isSplashVisible, setIsSplashVisible] = useState(true);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const navigationRef = useRef<any>(null);
  const previousRouteNameRef = useRef<string | undefined>(undefined);

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
      <PostHogProvider
        client={posthog}
        autocapture={{
          captureTouches: true,
          captureScreens: false,
        }}
      >
        <NavigationContainer
          ref={navigationRef}
          onReady={() => {
            setNavigationRef(navigationRef.current);
            const route = navigationRef.current?.getCurrentRoute?.();
            previousRouteNameRef.current = route?.name;

            // optional: prove it's working
            posthog.capture('app_ready');

            // initial screen
            if (route?.name) {
              posthog.screen(route.name, route.params ?? {});
            }
          }}
          onStateChange={() => {
            const route = navigationRef.current?.getCurrentRoute?.();
            const currentRouteName = route?.name;
            const previousRouteName = previousRouteNameRef.current;

            if (currentRouteName && currentRouteName !== previousRouteName) {
              posthog.screen(currentRouteName, route?.params ?? {});
              previousRouteNameRef.current = currentRouteName;
            }
          }}
        >
          <MainNavigator />
        </NavigationContainer>
        {isSplashVisible && (
          <Animated.View style={[styles.splashOverlay, { opacity: fadeAnim }]} pointerEvents="none">
            <Image source={splashLogo} style={styles.splashImage} resizeMode="contain" />
          </Animated.View>
        )}
      </PostHogProvider>
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
