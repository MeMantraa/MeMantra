# Notification Content Design

## Overview

The notification content system provides dynamic, engaging, and personalized push notification messages for mantra reminders. It includes motivational CTAs (Call-to-Actions), time-based variations, and category-specific templates to maximize user engagement.

## Features

### 1. **Time-Based Templates**

Notifications automatically adapt based on the time of day:

- **Morning (5am - 11:59am)**: Energizing, intention-setting messages
- **Afternoon (12pm - 4:59pm)**: Midday check-ins, refocusing messages
- **Evening (5pm - 9:59pm)**: Reflection, wind-down messages
- **Default (10pm - 4:59am)**: General mindfulness messages

**Example:**

```typescript
// Morning notification at 8am
"🌅 Start your day with intention"
"I am strong and capable"

Take a moment to reflect 🧘
```

### 2. **Motivational CTAs**

Four distinct CTA styles to encourage user action:

- **General**: Broad mindfulness prompts
- **Encouraging**: Supportive, uplifting messages
- **Action-Oriented**: Direct, immediate action prompts
- **Peaceful**: Calming, tranquil messages

**Examples:**

- "Take a moment to reflect 🧘"
- "You've got this! 💪"
- "Tap to read your mantra 👆"
- "Find your calm 🕊️"

### 3. **Category-Specific Templates**

Tailored notifications based on mantra categories:

- **Confidence**: Empowering, strength-focused
- **Gratitude**: Thankful, appreciative tones
- **Mindfulness**: Present-moment awareness
- **Motivation**: Achievement, goal-oriented
- **Self-Love**: Compassionate, accepting
- **Stress Relief**: Calming, tension-releasing

**Example (Confidence category):**

```
"💪 Boost your confidence"
"I am capable of amazing things"

Step into your power!
```

### 4. **Randomization**

To prevent notification fatigue:

- Multiple templates per time period (5+ options each)
- Multiple CTAs per style (5+ options each)
- Random selection ensures variety
- Users see fresh content with each notification

## Usage

### Basic Enhanced Notification

```typescript
import { NotificationService } from '../services/notification.service';

// Send with auto-generated content
await NotificationService.sendEnhancedReminderNotification(
  deviceToken,
  'I am strong and capable',
  reminderId,
);
```

### With Category Context

```typescript
// Notification adapts to category
await NotificationService.sendEnhancedReminderNotification(
  deviceToken,
  'I am confident in my abilities',
  reminderId,
  { categoryName: 'confidence' },
);
```

### With Custom CTA Style

```typescript
// Use encouraging tone
await NotificationService.sendEnhancedReminderNotification(
  deviceToken,
  'I deserve success',
  reminderId,
  { ctaStyle: 'encouraging' },
);
```

### Custom Title and CTA

```typescript
// Full customization
await NotificationService.sendEnhancedReminderNotification(
  deviceToken,
  'My custom mantra',
  reminderId,
  {
    customTitle: '🎯 Personal Goal Reminder',
    customCTA: "Let's make today count! 🚀",
  },
);
```

### Bulk Enhanced Reminders

**⚠️ Admin Only:** This endpoint requires admin authentication.

```typescript
await NotificationService.sendBulkEnhancedReminders([
  {
    deviceToken: 'token1',
    mantraText: 'I am at peace',
    reminderId: 1,
    categoryName: 'mindfulness',
    ctaStyle: 'peaceful',
  },
  {
    deviceToken: 'token2',
    mantraText: 'I can achieve my goals',
    reminderId: 2,
    categoryName: 'motivation',
    ctaStyle: 'actionOriented',
  },
]);
```

## Configuration

### Notification Content Config

Location: `src/config/notification-content.config.ts`

#### Key Functions

**`generateNotificationContent(options)`**
Main function that generates complete notification content.

**Options:**

- `mantraText` (required): The mantra text
- `categoryName` (optional): Category for template selection
- `hour` (optional): Hour for time-based template (0-23)
- `ctaStyle` (optional): CTA style ('general', 'encouraging', 'actionOriented', 'peaceful')
- `customTitle` (optional): Override title
- `customCTA` (optional): Override CTA

**Returns:**

```typescript
{
  title: string,  // Notification title
  body: string    // Formatted body with mantra + CTA
}
```

**`getTimeBasedTemplate(hour)`**
Get template for specific time of day.

**`getMotivationalCTA(style?)`**
Get random CTA for specified style.

**`getCategoryTemplate(categoryName)`**
Get template for specific category (case-insensitive, handles spaces).

**`formatNotificationBody(mantraText, cta, maxLength?)`**
Format body with proper truncation and structure.

## Content Templates

### Template Structure

```typescript
interface NotificationTemplate {
  title: string; // Display title
  ctaPrefix?: string; // Optional CTA prefix
  ctaSuffix?: string; // Optional CTA suffix
}
```

### Adding New Templates

**Add Time-Based Template:**

```typescript
// In notification-content.config.ts
NOTIFICATION_TITLES.morning.push({
  title: '🌈 New Morning Title',
  ctaSuffix: 'Optional morning CTA',
});
```

**Add Category Template:**

```typescript
CATEGORY_TEMPLATES.newCategory = [
  { title: '✨ Template 1', ctaSuffix: 'CTA 1' },
  { title: '💫 Template 2', ctaSuffix: 'CTA 2' },
  { title: '🌟 Template 3', ctaSuffix: 'CTA 3' },
];
```

**Add CTA:**

```typescript
MOTIVATIONAL_CTAS.general.push('New motivational CTA here 🎯');
```

## Best Practices

### 1. **Emoji Usage**

- Use 1-2 relevant emojis per title
- Keep emojis consistent with tone
- Avoid emoji overload

### 2. **Message Length**

- Titles: Keep under 50 characters for best display
- Body: Auto-truncates at 500 characters (configurable)
- Mantra text is quoted for clarity

### 3. **CTA Design**

- Clear, actionable language
- Encouraging without being pushy
- Aligned with brand voice (mindfulness, positivity)

### 4. **Variety**

- Maintain 5+ templates per category
- Regular content audits to remove stale messages
- A/B test different styles

### 5. **Personalization Priority**

1. Custom title/CTA (highest priority)
2. Category-specific template
3. Time-based template
4. Default template (fallback)

## Testing

### Unit Tests

Location: `test/config/notification-content.config.test.ts`

Run tests:

```bash
npm test -- notification-content
```

### Test Coverage

- ✅ Time-based template selection
- ✅ CTA style variations
- ✅ Category template matching
- ✅ Content formatting and truncation
- ✅ Content generation with options
- ✅ Template collections completeness

## API Endpoints

### Send Enhanced Reminder

**Endpoint:** `POST /api/notifications/send-enhanced`

**Request Body:**

```json
{
  "mantraText": "I am strong and capable",
  "reminderId": 123,
  "categoryName": "confidence",
  "ctaStyle": "encouraging"
}
```

**Response:**

```json
{
  "status": "success",
  "message": "Notification sent successfully",
  "data": {
    "ticket": {
      "status": "ok",
      "id": "receipt-id-123"
    }
  }
}
```

## Performance Considerations

### Content Generation

- O(1) template lookup
- Minimal CPU overhead
- No database queries required

### Caching

Not currently implemented, but could cache:

- Generated content for specific category + time combinations
- Template selections per user session

### Memory

- All templates loaded in memory (~10KB total)
- No runtime template compilation
- Minimal memory footprint

## Future Enhancements

### Planned Features

1. **User Preferences**: Allow users to prefer certain CTA styles
2. **A/B Testing**: Track which templates drive best engagement
3. **Localization**: Multi-language template support
4. **Dynamic Content**: Fetch templates from database
5. **AI-Generated CTAs**: Use AI to generate personalized messages
6. **User History**: Avoid repeating same templates too frequently
7. **Context-Aware**: Weather, location, user activity integration

### Potential Improvements

- Analytics integration for template performance
- User feedback on notification quality
- Seasonal template variations
- Event-based templates (holidays, milestones)

## Troubleshooting

### Issue: Same notifications repeatedly

**Solution**: Ensure randomization is working. Check that template arrays have multiple options.

### Issue: Notification truncated unexpectedly

**Solution**: Check `maxLength` parameter in `formatNotificationBody`. Default is 500 characters.

### Issue: Category not matching

**Solution**: Category names are case-insensitive and handle spaces (e.g., "Self Love" → "selfLove"). Check `getCategoryTemplate` logic.

### Issue: Emoji not displaying

**Solution**: Ensure proper UTF-8 encoding. Test on both iOS and Android devices.

## Support

For issues or questions about notification content:

- Open an issue on GitHub
- Tag with `notifications` label
- Include example output and expected behavior

## Changelog

### v1.0.0 (Current)

- ✅ Time-based templates (morning, afternoon, evening, default)
- ✅ 4 CTA styles with 5+ options each
- ✅ 6 category-specific template sets
- ✅ Content generation and formatting utilities
- ✅ Comprehensive test suite (43 tests)
- ✅ Enhanced notification service methods

### Future Versions

- v1.1.0: User preference support
- v1.2.0: A/B testing integration
- v2.0.0: Multi-language support
