import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../src/naviagation/types';
import {
  notificationSettingsService,
  NotificationSettings,
} from '../services/notification-settings.service';
import { notificationService } from '../services/notification.service';

type NotificationSettingsNavProp = StackNavigationProp<RootStackParamList>;

export default function NotificationSettingsScreen() {
  const _navigation = useNavigation<NotificationSettingsNavProp>();
  const [settings, setSettings] = useState<NotificationSettings>({
    enabled: true,
    quietHoursEnabled: false,
    quietHoursStart: '22:00',
    quietHoursEnd: '07:00',
  });
  const [loading, setLoading] = useState(true);
  const [permissionStatus, setPermissionStatus] = useState<string>('unknown');

  useEffect(() => {
    loadSettings();
    checkPermissionStatus();
  }, []);

  const loadSettings = async () => {
    try {
      const savedSettings = await notificationSettingsService.getSettings();
      setSettings(savedSettings);
    } catch (error) {
      console.error('Error loading settings:', error);
      Alert.alert('Error', 'Failed to load notification settings');
    } finally {
      setLoading(false);
    }
  };

  const checkPermissionStatus = async () => {
    try {
      const status = await notificationService.getPermissionStatus();
      setPermissionStatus(status.status);
    } catch (error) {
      console.error('Error checking permission status:', error);
    }
  };

  const handleToggleEnabled = async (value: boolean) => {
    if (value && permissionStatus !== 'granted') {
      // Request permissions if enabling notifications
      const result = await notificationService.requestPermissions();
      if (!result.granted) {
        Alert.alert(
          'Permissions Required',
          'Please enable notifications in your device settings to receive mantra reminders.',
          [{ text: 'OK' }],
        );
        return;
      }
      setPermissionStatus('granted');
    }

    try {
      const updatedSettings = await notificationSettingsService.updateSettings({
        enabled: value,
      });
      setSettings(updatedSettings);
    } catch (error) {
      console.error('Error updating notification enabled:', error);
      Alert.alert('Error', 'Failed to update notification settings');
    }
  };

  const handleToggleQuietHours = async (value: boolean) => {
    try {
      const updatedSettings = await notificationSettingsService.updateSettings({
        quietHoursEnabled: value,
      });
      setSettings(updatedSettings);
    } catch (error) {
      console.error('Error updating quiet hours:', error);
      Alert.alert('Error', 'Failed to update quiet hours settings');
    }
  };

  const handleTimeChange = async (field: 'quietHoursStart' | 'quietHoursEnd', time: string) => {
    try {
      const updatedSettings = await notificationSettingsService.updateSettings({
        [field]: time,
      });
      setSettings(updatedSettings);
    } catch (error) {
      console.error('Error updating time:', error);
      Alert.alert('Error', 'Failed to update time settings');
    }
  };

  const handleTestNotification = async () => {
    if (!settings.enabled) {
      Alert.alert('Notifications Disabled', 'Please enable notifications to test.');
      return;
    }

    if (permissionStatus !== 'granted') {
      Alert.alert(
        'Permissions Required',
        'Please enable notifications in your device settings first.',
      );
      return;
    }

    try {
      await notificationService.scheduleLocalNotification(
        'Test Notification',
        'This is a test notification from MeMantra',
        { type: 'test' },
        null, // Send immediately
        false, // Don't respect settings for test notifications
      );
      Alert.alert('Success', 'Test notification sent!');
    } catch (error) {
      console.error('Error sending test notification:', error);
      Alert.alert('Error', 'Failed to send test notification');
    }
  };

  const handleResetSettings = () => {
    Alert.alert(
      'Reset Settings',
      'Are you sure you want to reset notification settings to defaults?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              await notificationSettingsService.resetSettings();
              const defaultSettings = notificationSettingsService.getDefaultSettings();
              setSettings(defaultSettings);
              Alert.alert('Success', 'Settings reset to defaults');
            } catch (error) {
              console.error('Error resetting settings:', error);
              Alert.alert('Error', 'Failed to reset settings');
            }
          },
        },
      ],
    );
  };

  const showTimePicker = (field: 'quietHoursStart' | 'quietHoursEnd') => {
    const _currentTime = notificationSettingsService.parseTimeString(settings[field]);

    // Use Alert.prompt on iOS, fallback to Alert.alert on Android
    if (Platform.OS === 'ios' && Alert.prompt) {
      Alert.prompt(
        'Set Time',
        `Enter time in HH:MM format (24-hour)`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'OK',
            onPress: (text?: string) => {
              if (text && /^([01]\d|2[0-3]):([0-5]\d)$/.test(text)) {
                handleTimeChange(field, text);
              } else {
                Alert.alert('Invalid Format', 'Please enter time in HH:MM format (e.g., 22:00)');
              }
            },
          },
        ],
        'plain-text',
        settings[field],
      );
    } else {
      // On Android or if prompt is not available, show info alert
      Alert.alert(
        'Time Picker',
        `Current time: ${settings[field]}\n\nTime picker UI will be implemented with a proper date/time picker component for Android.`,
        [{ text: 'OK' }],
      );
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading settings...</Text>
      </View>
    );
  }

  const isWithinQuietHours = notificationSettingsService.isWithinQuietHours(settings);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Notification Settings</Text>

        {/* Permission Status */}
        {permissionStatus !== 'granted' && (
          <View style={styles.warningCard}>
            <Text style={styles.warningText}>
              ⚠️ Notifications are not enabled in your device settings. Please enable them to
              receive mantra reminders.
            </Text>
          </View>
        )}

        {/* Enable/Disable Notifications */}
        <View style={styles.section}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Enable Notifications</Text>
              <Text style={styles.settingDescription}>
                Receive reminders for your scheduled mantras
              </Text>
            </View>
            <Switch
              value={settings.enabled}
              onValueChange={handleToggleEnabled}
              trackColor={{ false: '#D1D5DB', true: '#8E9A86' }}
              thumbColor={settings.enabled ? '#FFFFFF' : '#F3F4F6'}
            />
          </View>
        </View>

        {/* Quiet Hours */}
        <View style={styles.section}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Quiet Hours (Do Not Disturb)</Text>
              <Text style={styles.settingDescription}>
                Prevent notifications during specified hours
              </Text>
            </View>
            <Switch
              value={settings.quietHoursEnabled}
              onValueChange={handleToggleQuietHours}
              disabled={!settings.enabled}
              trackColor={{ false: '#D1D5DB', true: '#8E9A86' }}
              thumbColor={settings.quietHoursEnabled ? '#FFFFFF' : '#F3F4F6'}
            />
          </View>

          {settings.quietHoursEnabled && (
            <View style={styles.timePickersContainer}>
              <TouchableOpacity
                style={styles.timePickerButton}
                onPress={() => showTimePicker('quietHoursStart')}
              >
                <Text style={styles.timePickerLabel}>Start Time</Text>
                <Text style={styles.timePickerValue}>{settings.quietHoursStart}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.timePickerButton}
                onPress={() => showTimePicker('quietHoursEnd')}
              >
                <Text style={styles.timePickerLabel}>End Time</Text>
                <Text style={styles.timePickerValue}>{settings.quietHoursEnd}</Text>
              </TouchableOpacity>
            </View>
          )}

          {settings.quietHoursEnabled && isWithinQuietHours && (
            <View style={styles.infoCard}>
              <Text style={styles.infoText}>
                🌙 Currently within quiet hours. Notifications are paused.
              </Text>
            </View>
          )}
        </View>

        {/* Test Notification */}
        <TouchableOpacity
          style={[styles.button, !settings.enabled && styles.buttonDisabled]}
          onPress={handleTestNotification}
          disabled={!settings.enabled}
        >
          <Text style={styles.buttonText}>Send Test Notification</Text>
        </TouchableOpacity>

        {/* Reset Settings */}
        <TouchableOpacity style={styles.resetButton} onPress={handleResetSettings}>
          <Text style={styles.resetButtonText}>Reset to Defaults</Text>
        </TouchableOpacity>

        {/* Info Text */}
        <Text style={styles.footerText}>
          Note: Notifications will respect your device's system settings and Do Not Disturb mode.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#A8B3A2',
  },
  content: {
    paddingTop: 70,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    fontFamily: 'Red_Hat_Text-Bold',
    color: 'white',
    marginBottom: 30,
  },
  loadingText: {
    fontSize: 18,
    color: 'white',
    textAlign: 'center',
    marginTop: 100,
  },
  warningCard: {
    backgroundColor: '#FEF3C7',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  warningText: {
    fontSize: 14,
    color: '#92400E',
    lineHeight: 20,
  },
  infoCard: {
    backgroundColor: '#DBEAFE',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#1E40AF',
    lineHeight: 20,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 18,
    fontFamily: 'Red_Hat_Text-SemiBold',
    color: '#333',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  timePickersContainer: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 12,
  },
  timePickerButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  timePickerLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  timePickerValue: {
    fontSize: 20,
    fontFamily: 'Red_Hat_Text-Bold',
    color: '#333',
  },
  button: {
    backgroundColor: '#8E9A86',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  buttonText: {
    fontSize: 18,
    fontFamily: 'Red_Hat_Text-SemiBold',
    color: 'white',
  },
  resetButton: {
    backgroundColor: 'transparent',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    marginBottom: 20,
  },
  resetButtonText: {
    fontSize: 16,
    fontFamily: 'Red_Hat_Text-SemiBold',
    color: 'white',
  },
  footerText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 18,
  },
});
