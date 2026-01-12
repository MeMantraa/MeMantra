import React from 'react';
import {
  FeatureFlagName,
  FeatureFlagArray,
  canViewFeature,
} from '../../backend/src/utils/featureFlags';

type Props = {
  featureFlag: FeatureFlagName;
  enabledFlags: FeatureFlagArray;
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

export function FeatureEnabled({ featureFlag, enabledFlags, children, fallback = null }: Props) {
  return canViewFeature(featureFlag, enabledFlags) ? <>{children}</> : <>{fallback}</>;
}
