import {
  FEATURE_FLAGS,
  FEATURE_FLAG_METADATA,
  canViewFeature,
  getFeatureFlagsCatalog,
  isValidFeatureFlag,
} from '../../src/utils/featureFlags';

describe('featureFlags utils', () => {
  it('builds the feature flag catalog from metadata', () => {
    expect(getFeatureFlagsCatalog()).toEqual(
      FEATURE_FLAGS.map((key) => ({
        key,
        ...FEATURE_FLAG_METADATA[key],
      })),
    );
  });

  it('returns true only when the flag exists in the array', () => {
    expect(canViewFeature('DARK_MODE', ['DARK_MODE'])).toBe(true);
    expect(canViewFeature('DARK_MODE', ['EXPERIMENTAL_FEATURE'])).toBe(false);
    expect(canViewFeature('DARK_MODE', null)).toBe(false);
    expect(canViewFeature('DARK_MODE', undefined)).toBe(false);
  });

  it('validates known feature flag names', () => {
    expect(isValidFeatureFlag('DARK_MODE')).toBe(true);
    expect(isValidFeatureFlag('NOT_A_FLAG')).toBe(false);
  });
});
