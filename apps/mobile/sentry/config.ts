import * as Sentry from '@sentry/react-native';

declare const __DEV__: boolean;

declare const process: {
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
    debug: true, // Enable debug mode to see what's happening
    tracesSampleRate: 1,

    enableAutoSessionTracking: true,
    enableNativeCrashHandling: true,

    // Basic settings
    sendDefaultPii: false,
    enableLogs: true,
    enableNativeNagger: false,

    beforeSend(event) {
      // Add custom context for debugging
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

// Performance state
const performanceState = {
  appStartTime: Date.now(),
};

// App Cold Start Tracking Function
const trackAppStartup = () => {
  const appStartDuration = Date.now() - performanceState.appStartTime;

  const startupSpan = Sentry.startInactiveSpan({
    name: 'App Cold Startup',
    op: 'app.start.cold',
  });

  startupSpan.setAttribute('duration_ms', appStartDuration);
  startupSpan.setAttribute('startup_type', 'cold');
  startupSpan.end();
};

// Initialize cold startup tracking
const startPerformanceTracking = () => {
  trackAppStartup();
};

export { startPerformanceTracking };
export * from '@sentry/react-native';
