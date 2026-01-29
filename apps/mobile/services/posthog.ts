import PostHog from 'posthog-react-native';

// eslint-disable-next-line no-undef
const EXPO_PUBLIC_POSTHOG_API_KEY = process.env.EXPO_PUBLIC_POSTHOG_API_KEY;

if (!EXPO_PUBLIC_POSTHOG_API_KEY) {
  console.warn('Missing EXPO_PUBLIC_POSTHOG_API_KEY');
}

export const posthog = new PostHog(EXPO_PUBLIC_POSTHOG_API_KEY ?? '', {
  host: 'https://us.i.posthog.com',
  captureAppLifecycleEvents: true,
  enableSessionReplay: true,
  sessionReplayConfig: {
    // Whether text and text input fields are masked. Default is true.
    // Password inputs are always masked regardless
    maskAllTextInputs: true,
    // Whether images are masked. Default is true.
    maskAllImages: false,
    // Enable masking of all sandboxed system views like UIImagePickerController, PHPickerViewController and CNContactPickerViewController. Default is true.
    // iOS only
    maskAllSandboxedViews: true,
    // Capture logs automatically. Default is true.
    // Android only (Native Logcat only)
    captureLog: true,
    // Whether network requests are captured in recordings. Default is true
    // Only metric-like data like speed, size, and response code are captured.
    // No data is captured from the request or response body.
    // iOS only
    captureNetworkTelemetry: true,
    // Throttling delay used to reduce the number of snapshots captured and reduce performance impact
    // The lower the number more snapshots will be captured but higher the performance impact
    // Default is 1000ms
    throttleDelayMs: 1000,
  },
});

posthog.debug(true);
