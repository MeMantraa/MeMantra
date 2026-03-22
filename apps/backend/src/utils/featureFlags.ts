// Add new flag types here.
export const FEATURE_FLAGS = [
  'EXPERIMENTAL_FEATURE',
  'DARK_MODE',
  'ADVANCED_ANALYTICS',
] as const;

export type FeatureFlagName = (typeof FEATURE_FLAGS)[number];
export type FeatureFlagArray = FeatureFlagName[] | undefined | null;

export interface FeatureFlagMetadata {
  label: string;
  description: string;
}

export const FEATURE_FLAG_METADATA: Record<FeatureFlagName, FeatureFlagMetadata> = {
  EXPERIMENTAL_FEATURE: {
    label: 'Experimental Feature',
    description: 'Enables in-progress features for controlled testing.',
  },
  DARK_MODE: {
    label: 'Dark Mode',
    description: 'Enables dark-theme experiences where supported.',
  },
  ADVANCED_ANALYTICS: {
    label: 'Advanced Analytics',
    description: 'Enables richer analytics views and metrics.',
  },
};

export function getFeatureFlagsCatalog() {
  return FEATURE_FLAGS.map((key) => ({
    key,
    ...FEATURE_FLAG_METADATA[key],
  }));
}

export function canViewFeature(flag: FeatureFlagName, flags: FeatureFlagArray): boolean {
  return Array.isArray(flags) ? flags.includes(flag) : false;
}

export function isValidFeatureFlag(x: string): x is FeatureFlagName {
  return (FEATURE_FLAGS as readonly string[]).includes(x);
}
