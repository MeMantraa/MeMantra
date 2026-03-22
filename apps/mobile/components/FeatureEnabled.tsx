import React, { useCallback, useEffect, useRef, useState } from 'react';
import { storage } from '../utils/storage';
import { authService } from '../services/auth.service';
import { useFocusEffect } from '@react-navigation/native';
import {
  FeatureFlagName,
  FeatureFlagArray,
  canViewFeature,
} from '../../backend/src/utils/featureFlags';

type Props = {
  featureFlag: FeatureFlagName;
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

export function FeatureEnabled({ featureFlag, children, fallback = null }: Props) {
  const [enabledFlags, setEnabledFlags] = useState<FeatureFlagArray>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const refreshFlags = useCallback(async () => {
    const cachedUser = await storage.getUserData();
    if (!isMountedRef.current) return;
    setEnabledFlags(cachedUser?.feature_flags ?? []);

    const token = await storage.getToken();
    if (!token || !isMountedRef.current) return;

    try {
      const meResponse = await authService.getMe(token);
      const freshUser = meResponse?.data?.user;
      if (!freshUser || !isMountedRef.current) return;

      const mergedUser = cachedUser ? { ...cachedUser, ...freshUser } : freshUser;
      await storage.saveUserData(mergedUser);

      if (!isMountedRef.current) return;
      setEnabledFlags(freshUser.feature_flags ?? []);
    } catch {
      // Keep cached flags if refresh fails.
    }
  }, []);

  useEffect(() => {
    void refreshFlags();
  }, [refreshFlags]);

  useFocusEffect(
    useCallback(() => {
      void refreshFlags();
      return () => {};
    }, [refreshFlags]),
  );

  if (enabledFlags === null) return null; // or fallback while loading

  return canViewFeature(featureFlag, enabledFlags) ? <>{children}</> : <>{fallback}</>;
}
