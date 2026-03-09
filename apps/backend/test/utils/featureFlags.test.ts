import { canViewFeature, isValidFeatureFlag, FEATURE_FLAGS } from '../../src/utils/featureFlags';

describe('featureFlags', () => {
  describe('canViewFeature', () => {
    it('should return true when flag is in array', () => {
      expect(canViewFeature('DARK_MODE', ['DARK_MODE', 'EXPERIMENTAL_FEATURE'])).toBe(true);
    });

    it('should return false when flag is not in array', () => {
      expect(canViewFeature('DARK_MODE', ['EXPERIMENTAL_FEATURE'])).toBe(false);
    });

    it('should return false when flags is undefined', () => {
      expect(canViewFeature('DARK_MODE', undefined)).toBe(false);
    });

    it('should return false when flags is null', () => {
      expect(canViewFeature('DARK_MODE', null)).toBe(false);
    });

    it('should return false when flags is empty array', () => {
      expect(canViewFeature('DARK_MODE', [])).toBe(false);
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
      expect(isValidFeatureFlag('random')).toBe(false);
      expect(isValidFeatureFlag('')).toBe(false);
    });
  });

  describe('FEATURE_FLAGS', () => {
    it('should contain all expected flags', () => {
      expect(FEATURE_FLAGS).toContain('EXPERIMENTAL_FEATURE');
      expect(FEATURE_FLAGS).toContain('DARK_MODE');
      expect(FEATURE_FLAGS).toContain('ADVANCED_ANALYTICS');
    });

    it('should have correct length', () => {
      expect(FEATURE_FLAGS.length).toBe(3);
    });
  });
});
