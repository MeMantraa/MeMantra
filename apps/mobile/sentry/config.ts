import * as Sentry from '@sentry/react-native';

// TypeScript declarations for Sentry usage
declare var __DEV__: boolean;

declare var process: {
  env: {
    EXPO_PUBLIC_SENTRY_DSN?: string;
  };
};

const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN;

// Initialize Sentry for error tracking and crash reporting
export const initializeSentry = () => {
  if (!SENTRY_DSN) {
    console.warn('Sentry DSN not found. Sentry will not be initialized.');
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,

    // Basic error tracking
    enableNativeCrashHandling: true,
    enableAutoSessionTracking: true,
    sendDefaultPii: false,
    enableLogs: true,
    enableNativeNagger: false,

    beforeSend(event) {
      // Custom context for debugging
      if (event.contexts) {
        event.contexts.app = {
          ...event.contexts.app,
          build_type: __DEV__ ? 'development' : 'release',
        };
      }
      return event;
    },
  });
};

export { Sentry };
