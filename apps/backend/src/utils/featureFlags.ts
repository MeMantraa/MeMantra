//add other flags here
export const FEATURE_FLAGS = [
  'EXPERIMENTAL_FEATURE',
  'DARK_MODE',
  'ADVANCED_ANALYTICS',
] as const;

export type FeatureFlagName = (typeof FEATURE_FLAGS)[number];
export type FeatureFlagArray = FeatureFlagName[] | undefined | null;

export function canViewFeature(flag: FeatureFlagName, flags: FeatureFlagArray): boolean {
  return Array.isArray(flags) ? flags.includes(flag) : false;
}

export function isValidFeatureFlag(x: string): x is FeatureFlagName {
  return (FEATURE_FLAGS as readonly string[]).includes(x);
}