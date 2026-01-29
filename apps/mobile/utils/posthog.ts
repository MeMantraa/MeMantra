import { useEffect } from 'react';
import { useRoute } from '@react-navigation/native';
import { posthog } from '../services/posthog';

export const usePostHogScreen = (properties?: Record<string, unknown>) => {
  const route = useRoute<any>();

  useEffect(() => {
    if (!route?.name) return;
    posthog.capture('screen_viewed', { screen: route.name, ...(properties ?? {}) });
  }, [route?.name, properties]);
};
