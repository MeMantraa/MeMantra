/**
 * Notification Content Configuration
 * Defines templates and CTAs for mantra reminder notifications
 */

export interface NotificationTemplate {
  title: string;
  ctaPrefix?: string;
  ctaSuffix?: string;
}

export interface TimeBasedTemplates {
  morning: NotificationTemplate[];
  afternoon: NotificationTemplate[];
  evening: NotificationTemplate[];
  default: NotificationTemplate[];
}

/**
 * Motivational title templates for notifications
 */
export const NOTIFICATION_TITLES: TimeBasedTemplates = {
  morning: [
    { title: '🌅 Start your day with intention' },
    { title: '☀️ Good morning! Time for your mantra' },
    { title: '🌄 Begin your day mindfully' },
    { title: '✨ Morning mindfulness moment' },
    { title: '🌞 Rise and affirm' },
  ],
  afternoon: [
    { title: '🌤️ Midday mindfulness check-in' },
    { title: '💫 Pause and reflect' },
    { title: '🌿 Time to refocus your energy' },
    { title: '⏰ Your afternoon affirmation' },
    { title: '🧘 Take a mindful moment' },
  ],
  evening: [
    { title: '🌙 Evening reflection time' },
    { title: '⭐ Wind down with intention' },
    { title: '🌆 End your day mindfully' },
    { title: '✨ Your evening affirmation' },
    { title: '🌃 Reflect on your day' },
  ],
  default: [
    { title: '💭 Time for your mantra' },
    { title: '🎯 Your daily affirmation' },
    { title: '✨ Mindfulness moment' },
    { title: '🌟 Remember your intention' },
    { title: '💪 Affirm your strength' },
  ],
};

/**
 * Motivational CTAs (Call-to-Actions)
 */
export const MOTIVATIONAL_CTAS = {
  general: [
    'Take a moment to reflect 🧘',
    'Tap to embrace this moment ✨',
    'Open to affirm yourself 💫',
    'Click to center yourself 🎯',
    'Your mindful moment awaits 🌟',
  ],
  encouraging: [
    'You\'ve got this! 💪',
    'Believe in yourself today ❤️',
    'You are capable of amazing things 🌟',
    'Take a breath and affirm 🌬️',
    'Your power is in this moment ⚡',
  ],
  actionOriented: [
    'Tap to read your mantra 👆',
    'Open and take action 🚀',
    'Start your practice now 🎯',
    'Click to begin ▶️',
    'Time to practice 📖',
  ],
  peaceful: [
    'Find your calm 🕊️',
    'Peace is one tap away ☮️',
    'Center yourself now 🧘‍♀️',
    'Breathe and believe 🌊',
    'Embrace tranquility 🍃',
  ],
};

/**
 * Category-specific notification templates
 * Can be used when category information is available
 */
export const CATEGORY_TEMPLATES: Record<string, NotificationTemplate[]> = {
  confidence: [
    { title: '💪 Boost your confidence', ctaSuffix: 'Step into your power!' },
    { title: '🌟 You are capable', ctaSuffix: 'Believe in yourself today' },
    { title: '⚡ Embrace your strength', ctaSuffix: 'You\'ve got this!' },
  ],
  gratitude: [
    { title: '🙏 Practice gratitude', ctaSuffix: 'Count your blessings' },
    { title: '❤️ Appreciate this moment', ctaSuffix: 'What are you grateful for?' },
    { title: '✨ Give thanks', ctaSuffix: 'Gratitude opens doors' },
  ],
  mindfulness: [
    { title: '🧘 Be present', ctaSuffix: 'This moment is all you have' },
    { title: '🌿 Find your center', ctaSuffix: 'Breathe and be' },
    { title: '☮️ Peace begins within', ctaSuffix: 'Take a mindful breath' },
  ],
  motivation: [
    { title: '🚀 Take action', ctaSuffix: 'Your goals await!' },
    { title: '🎯 Stay focused', ctaSuffix: 'You\'re making progress' },
    { title: '💫 Keep going', ctaSuffix: 'Success is within reach' },
  ],
  selfLove: [
    { title: '❤️ Love yourself first', ctaSuffix: 'You deserve kindness' },
    { title: '🌸 Be gentle with yourself', ctaSuffix: 'You are enough' },
    { title: '💖 Embrace who you are', ctaSuffix: 'Self-love is powerful' },
  ],
  stress: [
    { title: '😌 Release the tension', ctaSuffix: 'Find your calm' },
    { title: '🌊 Let it go', ctaSuffix: 'Peace is your birthright' },
    { title: '🕊️ Choose peace', ctaSuffix: 'Breathe through it' },
  ],
};

/**
 * Get notification content based on time of day
 * @param hour - Hour of day (0-23)
 * @returns Template for the specified time
 */
export function getTimeBasedTemplate(hour: number): NotificationTemplate {
  let timeOfDay: keyof TimeBasedTemplates;

  if (hour >= 5 && hour < 12) {
    timeOfDay = 'morning';
  } else if (hour >= 12 && hour < 17) {
    timeOfDay = 'afternoon';
  } else if (hour >= 17 && hour < 22) {
    timeOfDay = 'evening';
  } else {
    timeOfDay = 'default';
  }

  const templates = NOTIFICATION_TITLES[timeOfDay];
  const randomIndex = Math.floor(Math.random() * templates.length);
  return templates[randomIndex];
}

/**
 * Get a random motivational CTA
 * @param style - Style of CTA (general, encouraging, actionOriented, peaceful)
 * @returns Random CTA string
 */
export function getMotivationalCTA(style: CTAStyle = 'general'): string {
  const ctas = MOTIVATIONAL_CTAS[style];
  const randomIndex = Math.floor(Math.random() * ctas.length);
  return ctas[randomIndex];
}

/**
 * Get category-specific template
 * @param categoryName - Name of the category (lowercase)
 * @returns Category-specific template or default template
 */
export function getCategoryTemplate(categoryName: string): NotificationTemplate {
  // Convert to camelCase for matching (e.g., "self love" -> "selfLove")
  // Using split/map approach instead of regex to avoid any potential ReDoS
  const normalizedCategory = categoryName
    .toLowerCase()
    .split(/\s/)
    .filter((word) => word.length > 0)
    .map((word, index) => (index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1)))
    .join('');

  const templates = CATEGORY_TEMPLATES[normalizedCategory];

  if (templates && templates.length > 0) {
    const randomIndex = Math.floor(Math.random() * templates.length);
    return templates[randomIndex];
  }

  // Return default template if category not found
  const defaultTemplates = NOTIFICATION_TITLES.default;
  const randomIndex = Math.floor(Math.random() * defaultTemplates.length);
  return defaultTemplates[randomIndex];
}

/**
 * Format notification body with mantra text and CTA
 * @param mantraText - The mantra text
 * @param cta - Call to action message
 * @param maxLength - Maximum length of body (default 500)
 * @returns Formatted notification body
 */
export function formatNotificationBody(
  mantraText: string,
  cta: string,
  maxLength: number = 500
): string {
  const separator = '\n\n';
  const fullBody = `"${mantraText}"${separator}${cta}`;

  if (fullBody.length <= maxLength) {
    return fullBody;
  }

  // Truncate mantra text to fit with CTA
  const ctaLength = cta.length + separator.length + 5; // +5 for quotes and ellipsis (", ...")
  const availableLength = maxLength - ctaLength;

  if (availableLength < 20) {
    // If not enough space, just return truncated mantra
    return `"${mantraText.substring(0, maxLength - 5)}..."`;
  }

  const truncatedMantra = mantraText.substring(0, availableLength - 3);
  return `"${truncatedMantra}..."${separator}${cta}`;
}

/**
 * CTA style type - extracted for reuse
 */
export type CTAStyle = keyof typeof MOTIVATIONAL_CTAS;

/**
 * Generate complete notification content
 * @param options - Notification options
 * @returns Object with title and body
 */
export interface NotificationContentOptions {
  mantraText: string;
  categoryName?: string;
  hour?: number;
  ctaStyle?: CTAStyle;
  customTitle?: string;
  customCTA?: string;
}

export function generateNotificationContent(
  options: NotificationContentOptions
): { title: string; body: string } {
  const {
    mantraText,
    categoryName,
    hour = new Date().getHours(),
    ctaStyle = 'general',
    customTitle,
    customCTA,
  } = options;

  // Determine title
  let title: string;
  let templateCTASuffix: string | undefined;

  if (customTitle) {
    title = customTitle;
  } else if (categoryName) {
    const template = getCategoryTemplate(categoryName);
    title = template.title;
    templateCTASuffix = template.ctaSuffix;
  } else {
    const template = getTimeBasedTemplate(hour);
    title = template.title;
    templateCTASuffix = template.ctaSuffix;
  }

  // Determine CTA
  const cta = customCTA || templateCTASuffix || getMotivationalCTA(ctaStyle);

  // Format body
  const body = formatNotificationBody(mantraText, cta);

  return { title, body };
}
