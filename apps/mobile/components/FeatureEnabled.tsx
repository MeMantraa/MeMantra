import React, { useEffect, useState } from 'react';
import { storage } from '../utils/storage';
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

  useEffect(() => {
    let mounted = true;
    (async () => {
      const user = await storage.getUserData();
      if (mounted) setEnabledFlags(user?.feature_flags ?? []);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  if (enabledFlags === null) return null; // or fallback while loading

  return canViewFeature(featureFlag, enabledFlags) ? <>{children}</> : <>{fallback}</>;
}
