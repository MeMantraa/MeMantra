import React, { useCallback, useEffect, useRef, useState } from 'react';
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import type { NavigationContainerRefWithCurrent } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Animated, Image, StyleSheet } from 'react-native';
import { usePostHog, PostHogProvider } from 'posthog-react-native';
import * as SplashScreen from 'expo-splash-screen';
import MainNavigator from './app/index';
import splashLogo from './assets/logo.png';
import './global.css';
import type { RootStackParamList } from './types/navigation';
import LibreBaskerville from './assets/fonts/LibreBaskerville-Regular.ttf';
import * as Font from 'expo-font';
import { setNavigationRef } from './services/api.config';
declare const process: {
  env: {
    EXPO_PUBLIC_POSTHOG_API_KEY?: string;
    EXPO_PUBLIC_POSTHOG_HOST?: string;
  };
};

const POSTHOG_API_KEY = process.env.EXPO_PUBLIC_POSTHOG_API_KEY;
const POSTHOG_HOST = process.env.EXPO_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com';

const PostHogLogger = () => {
  const posthog = usePostHog();
  const hasLogged = useRef(false);

  useEffect(() => {
    if (!posthog || hasLogged.current) {
      return;
    }

    let isMounted = true;

    const logWithId = (distinctId: string) => {
      if (!isMounted || hasLogged.current) {
        return;
      }

      hasLogged.current = true;
      console.log('[PostHog] Client initialized. Host:', POSTHOG_HOST);
      console.log('[PostHog] Distinct ID:', distinctId);

      posthog.capture('posthog_debug_event', {
        source: 'App.tsx',
        distinctId,
        timestamp: new Date().toISOString(),
      });

      console.log('[PostHog] Debug event sent.');
    };

    const tryLogImmediately = () => {
      const distinctId = posthog.getDistinctId();
      if (distinctId) {
        logWithId(distinctId);
        return true;
      }
      return false;
    };

    if (tryLogImmediately()) {
      return () => {
        isMounted = false;
      };
    }

    const interval = setInterval(() => {
      if (!isMounted) {
        return;
      }

      const distinctId = posthog.getDistinctId();
      if (distinctId) {
        clearInterval(interval);
        logWithId(distinctId);
      }
    }, 250);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [posthog]);

  return null;
};

type NavigationRef = NavigationContainerRefWithCurrent<RootStackParamList>;

type TrackedNavigationProps = {
  navigationRef: NavigationRef;
  children: React.ReactNode;
};

const TrackedNavigation = ({ navigationRef, children }: TrackedNavigationProps) => {
  const posthog = usePostHog();
  const lastRouteRef = useRef<string | undefined>(undefined);

  const reportScreen = useCallback(
    (routeName?: string) => {
      if (!posthog || !routeName || lastRouteRef.current === routeName) {
        return;
      }

      lastRouteRef.current = routeName;
      posthog.screen(routeName);
    },
    [posthog],
  );

  const handleReady = useCallback(() => {
    reportScreen(navigationRef.getCurrentRoute()?.name);
  }, [navigationRef, reportScreen]);

  const handleStateChange = useCallback(() => {
    reportScreen(navigationRef.getCurrentRoute()?.name);
  }, [navigationRef, reportScreen]);

  return (
    <NavigationContainer
      ref={navigationRef}
      onReady={handleReady}
      onStateChange={handleStateChange}
    >
      {children}
    </NavigationContainer>
  );
};

SplashScreen.preventAutoHideAsync();

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);
  const [isSplashVisible, setIsSplashVisible] = useState(true);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const navigationRef = useNavigationContainerRef<RootStackParamList>();

  useEffect(() => {
    if (!POSTHOG_API_KEY) {
      console.log('[PostHog] API key missing. Analytics disabled.');
    } else {
      console.log('[PostHog] API key detected. Initializing PostHogProvider.');
    }
  }, []);

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

  const navigationTree = (
    <TrackedNavigation navigationRef={navigationRef}>
      <MainNavigator />
    </TrackedNavigation>
  );

  const content = POSTHOG_API_KEY ? (
    <PostHogProvider
      apiKey={POSTHOG_API_KEY}
      options={{
        host: POSTHOG_HOST,
        captureAppLifecycleEvents: true,
      }}
      autocapture={{
        captureTouches: true,
        captureScreens: false,
      }}
    >
      <PostHogLogger />
      {navigationTree}
    </PostHogProvider>
  ) : (
    navigationTree
  );

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
