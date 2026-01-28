import { canViewFeature, isValidFeatureFlag, FEATURE_FLAGS } from '../../src/utils/featureFlags';

describe('featureFlags', () => {
  describe('canViewFeature', () => {
    it('should return true if user has the feature flag', () => {
      const result = canViewFeature('DARK_MODE', ['DARK_MODE', 'EXPERIMENTAL_FEATURE']);
      expect(result).toBe(true);
    });

    it('should return false if user does not have the feature flag', () => {
      const result = canViewFeature('ADVANCED_ANALYTICS', ['DARK_MODE']);
      expect(result).toBe(false);
    });

    it('should return false if flags array is empty', () => {
      const result = canViewFeature('DARK_MODE', []);
      expect(result).toBe(false);
    });

    it('should return false if flags is undefined', () => {
      const result = canViewFeature('DARK_MODE', undefined);
      expect(result).toBe(false);
    });

    it('should return false if flags is null', () => {
      const result = canViewFeature('DARK_MODE', null);
      expect(result).toBe(false);
    });
  });

  describe('isValidFeatureFlag', () => {
    it('should return true for valid feature flags', () => {
      expect(isValidFeatureFlag('EXPERIMENTAL_FEATURE')).toBe(true);
      expect(isValidFeatureFlag('DARK_MODE')).toBe(true);
      expect(isValidFeatureFlag('ADVANCED_ANALYTICS')).toBe(true);
    });

    it('should return false for invalid feature flags', () => {
      expect(isValidFeatureFlag('INVALID_FLAG')).toBe(false);
      expect(isValidFeatureFlag('random_string')).toBe(false);
      expect(isValidFeatureFlag('')).toBe(false);
    });
  });

  describe('FEATURE_FLAGS', () => {
    it('should contain expected feature flags', () => {
      expect(FEATURE_FLAGS).toContain('EXPERIMENTAL_FEATURE');
      expect(FEATURE_FLAGS).toContain('DARK_MODE');
      expect(FEATURE_FLAGS).toContain('ADVANCED_ANALYTICS');
    });

    it('should have at least 3 feature flags', () => {
      expect(FEATURE_FLAGS.length).toBeGreaterThanOrEqual(3);
    });
  });
});
