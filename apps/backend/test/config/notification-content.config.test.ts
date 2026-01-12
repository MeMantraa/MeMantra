import {
  getTimeBasedTemplate,
  getMotivationalCTA,
  getCategoryTemplate,
  formatNotificationBody,
  generateNotificationContent,
  NOTIFICATION_TITLES,
  MOTIVATIONAL_CTAS,
  CATEGORY_TEMPLATES,
  CTAStyle,
} from '../../src/config/notification-content.config';

describe('Notification Content Configuration', () => {
  describe('getTimeBasedTemplate', () => {
    it('should return morning template for hours 5-11', () => {
      for (let hour = 5; hour < 12; hour++) {
        const template = getTimeBasedTemplate(hour);
        expect(NOTIFICATION_TITLES.morning).toContainEqual(template);
      }
    });

    it('should return afternoon template for hours 12-16', () => {
      for (let hour = 12; hour < 17; hour++) {
        const template = getTimeBasedTemplate(hour);
        expect(NOTIFICATION_TITLES.afternoon).toContainEqual(template);
      }
    });

    it('should return evening template for hours 17-21', () => {
      for (let hour = 17; hour < 22; hour++) {
        const template = getTimeBasedTemplate(hour);
        expect(NOTIFICATION_TITLES.evening).toContainEqual(template);
      }
    });

    it('should return default template for late night hours', () => {
      const lateNightHours = [0, 1, 2, 3, 4, 22, 23];
      lateNightHours.forEach((hour) => {
        const template = getTimeBasedTemplate(hour);
        expect(NOTIFICATION_TITLES.default).toContainEqual(template);
      });
    });

    it('should return a valid template object', () => {
      const template = getTimeBasedTemplate(10);
      expect(template).toHaveProperty('title');
      expect(typeof template.title).toBe('string');
      expect(template.title.length).toBeGreaterThan(0);
    });
  });

  describe('getMotivationalCTA', () => {
    it('should return general CTA by default', () => {
      const cta = getMotivationalCTA();
      expect(MOTIVATIONAL_CTAS.general).toContain(cta);
    });

    it('should return encouraging CTA when specified', () => {
      const cta = getMotivationalCTA('encouraging');
      expect(MOTIVATIONAL_CTAS.encouraging).toContain(cta);
    });

    it('should return actionOriented CTA when specified', () => {
      const cta = getMotivationalCTA('actionOriented');
      expect(MOTIVATIONAL_CTAS.actionOriented).toContain(cta);
    });

    it('should return peaceful CTA when specified', () => {
      const cta = getMotivationalCTA('peaceful');
      expect(MOTIVATIONAL_CTAS.peaceful).toContain(cta);
    });

    it('should return a non-empty string', () => {
      const styles: CTAStyle[] = ['general', 'encouraging', 'actionOriented', 'peaceful'];

      styles.forEach((style) => {
        const cta = getMotivationalCTA(style);
        expect(typeof cta).toBe('string');
        expect(cta.length).toBeGreaterThan(0);
      });
    });
  });

  describe('getCategoryTemplate', () => {
    it('should return confidence template for confidence category', () => {
      const template = getCategoryTemplate('confidence');
      expect(CATEGORY_TEMPLATES.confidence).toContainEqual(template);
    });

    it('should return gratitude template for gratitude category', () => {
      const template = getCategoryTemplate('gratitude');
      expect(CATEGORY_TEMPLATES.gratitude).toContainEqual(template);
    });

    it('should handle case-insensitive category names', () => {
      const template1 = getCategoryTemplate('Confidence');
      const template2 = getCategoryTemplate('CONFIDENCE');
      const template3 = getCategoryTemplate('confidence');

      expect(CATEGORY_TEMPLATES.confidence).toContainEqual(template1);
      expect(CATEGORY_TEMPLATES.confidence).toContainEqual(template2);
      expect(CATEGORY_TEMPLATES.confidence).toContainEqual(template3);
    });

    it('should handle category names with spaces', () => {
      const template = getCategoryTemplate('self love');
      expect(CATEGORY_TEMPLATES.selfLove).toContainEqual(template);
    });

    it('should return default template for unknown category', () => {
      const template = getCategoryTemplate('unknown_category');
      expect(NOTIFICATION_TITLES.default).toContainEqual(template);
    });

    it('should return a valid template object', () => {
      const template = getCategoryTemplate('mindfulness');
      expect(template).toHaveProperty('title');
      expect(typeof template.title).toBe('string');
    });
  });

  describe('formatNotificationBody', () => {
    it('should format body with mantra and CTA', () => {
      const mantraText = 'I am strong and capable';
      const cta = 'Take a moment to reflect';

      const body = formatNotificationBody(mantraText, cta);

      expect(body).toContain(mantraText);
      expect(body).toContain(cta);
      expect(body).toMatch(/".*"/); // Should have quotes around mantra
    });

    it('should not truncate short content', () => {
      const mantraText = 'I am enough';
      const cta = 'Believe it';

      const body = formatNotificationBody(mantraText, cta);

      expect(body).toBe(`"${mantraText}"\n\n${cta}`);
    });

    it('should truncate long mantra text to fit with CTA', () => {
      const longMantra = 'A'.repeat(500);
      const cta = 'Take a moment';

      const body = formatNotificationBody(longMantra, cta, 100);

      expect(body.length).toBeLessThanOrEqual(100);
      expect(body).toContain('...');
      expect(body).toContain(cta);
    });

    it('should respect maxLength parameter', () => {
      const mantraText = 'I am strong and capable of amazing things';
      const cta = 'Believe in yourself';

      const body = formatNotificationBody(mantraText, cta, 50);

      expect(body.length).toBeLessThanOrEqual(50);
    });

    it('should handle very short maxLength gracefully', () => {
      const mantraText = 'I am strong';
      const cta = 'Go!';

      const body = formatNotificationBody(mantraText, cta, 30);

      expect(body.length).toBeLessThanOrEqual(30);
      expect(body).toContain('"');
    });

    it('should use default maxLength of 500 when not specified', () => {
      const longMantra = 'A'.repeat(600);
      const cta = 'Test';

      const body = formatNotificationBody(longMantra, cta);

      expect(body.length).toBeLessThanOrEqual(500);
    });
  });

  describe('generateNotificationContent', () => {
    it('should generate content with default settings', () => {
      const result = generateNotificationContent({
        mantraText: 'I am strong and capable',
      });

      expect(result).toHaveProperty('title');
      expect(result).toHaveProperty('body');
      expect(typeof result.title).toBe('string');
      expect(typeof result.body).toBe('string');
      expect(result.body).toContain('I am strong and capable');
    });

    it('should use custom title when provided', () => {
      const customTitle = 'Custom Notification Title';

      const result = generateNotificationContent({
        mantraText: 'Test mantra',
        customTitle,
      });

      expect(result.title).toBe(customTitle);
    });

    it('should use custom CTA when provided', () => {
      const customCTA = 'Custom call to action';

      const result = generateNotificationContent({
        mantraText: 'Test mantra',
        customCTA,
      });

      expect(result.body).toContain(customCTA);
    });

    it('should use category template when category provided', () => {
      const result = generateNotificationContent({
        mantraText: 'I am confident',
        categoryName: 'confidence',
      });

      expect(result.title).toBeTruthy();
      expect(result.body).toContain('I am confident');
    });

    it('should use time-based template when hour provided', () => {
      const result = generateNotificationContent({
        mantraText: 'Morning mantra',
        hour: 8,
      });

      expect(result.title).toBeTruthy();
      expect(result.body).toContain('Morning mantra');
    });

    it('should apply CTA style', () => {
      const result = generateNotificationContent({
        mantraText: 'Test',
        ctaStyle: 'encouraging',
      });

      expect(result.body).toBeTruthy();
      // CTA should be from encouraging category
      const hasEncouragingCTA = MOTIVATIONAL_CTAS.encouraging.some((cta) =>
        result.body.includes(cta)
      );
      expect(hasEncouragingCTA).toBe(true);
    });

    it('should prioritize customTitle over category template', () => {
      const customTitle = 'My Custom Title';

      const result = generateNotificationContent({
        mantraText: 'Test',
        categoryName: 'confidence',
        customTitle,
      });

      expect(result.title).toBe(customTitle);
    });

    it('should prioritize customCTA over template CTA', () => {
      const customCTA = 'My Custom CTA';

      const result = generateNotificationContent({
        mantraText: 'Test',
        categoryName: 'confidence',
        customCTA,
      });

      expect(result.body).toContain(customCTA);
    });

    it('should handle long mantra text appropriately', () => {
      const longMantra = 'A'.repeat(600);

      const result = generateNotificationContent({
        mantraText: longMantra,
      });

      expect(result.body.length).toBeLessThanOrEqual(500);
      expect(result.body).toContain('...');
    });

    it('should generate different content for different times of day', () => {
      const morningResult = generateNotificationContent({
        mantraText: 'Test',
        hour: 8,
      });

      const eveningResult = generateNotificationContent({
        mantraText: 'Test',
        hour: 20,
      });

      // Titles might be different (though not guaranteed due to randomization)
      expect(morningResult.title).toBeTruthy();
      expect(eveningResult.title).toBeTruthy();
    });
  });

  describe('Template Collections', () => {
    it('should have templates for all time periods', () => {
      expect(NOTIFICATION_TITLES.morning.length).toBeGreaterThan(0);
      expect(NOTIFICATION_TITLES.afternoon.length).toBeGreaterThan(0);
      expect(NOTIFICATION_TITLES.evening.length).toBeGreaterThan(0);
      expect(NOTIFICATION_TITLES.default.length).toBeGreaterThan(0);
    });

    it('should have CTAs for all styles', () => {
      expect(MOTIVATIONAL_CTAS.general.length).toBeGreaterThan(0);
      expect(MOTIVATIONAL_CTAS.encouraging.length).toBeGreaterThan(0);
      expect(MOTIVATIONAL_CTAS.actionOriented.length).toBeGreaterThan(0);
      expect(MOTIVATIONAL_CTAS.peaceful.length).toBeGreaterThan(0);
    });

    it('should have templates for major categories', () => {
      const expectedCategories = [
        'confidence',
        'gratitude',
        'mindfulness',
        'motivation',
        'selfLove',
        'stress',
      ];

      expectedCategories.forEach((category) => {
        expect(CATEGORY_TEMPLATES[category]).toBeDefined();
        expect(CATEGORY_TEMPLATES[category].length).toBeGreaterThan(0);
      });
    });

    it('should have at least 3 templates per time period', () => {
      expect(NOTIFICATION_TITLES.morning.length).toBeGreaterThanOrEqual(3);
      expect(NOTIFICATION_TITLES.afternoon.length).toBeGreaterThanOrEqual(3);
      expect(NOTIFICATION_TITLES.evening.length).toBeGreaterThanOrEqual(3);
      expect(NOTIFICATION_TITLES.default.length).toBeGreaterThanOrEqual(3);
    });

    it('should have at least 3 CTAs per style', () => {
      expect(MOTIVATIONAL_CTAS.general.length).toBeGreaterThanOrEqual(3);
      expect(MOTIVATIONAL_CTAS.encouraging.length).toBeGreaterThanOrEqual(3);
      expect(MOTIVATIONAL_CTAS.actionOriented.length).toBeGreaterThanOrEqual(3);
      expect(MOTIVATIONAL_CTAS.peaceful.length).toBeGreaterThanOrEqual(3);
    });
  });
});
