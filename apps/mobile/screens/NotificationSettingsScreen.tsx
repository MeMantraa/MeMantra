import React, { useState, useEffect } from 'react';
import { View, Switch, TouchableOpacity, ScrollView, Alert, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../src/navigation/types';
import {
  notificationSettingsService,
  NotificationSettings,
} from '../services/notification-settings.service';
import { notificationService } from '../services/notification.service';
import { useTheme } from '../context/ThemeContext';
import AppText from '../components/UI/textWrapper';

type NotificationSettingsNavProp = StackNavigationProp<RootStackParamList>;

export default function NotificationSettingsScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<NotificationSettingsNavProp>();
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
      Alert.alert('Error', 'Failed to check notification permissions.');
    }
  };

  const handleToggleEnabled = async (value: boolean) => {
    if (value && permissionStatus !== 'granted') {
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
        null,
        false,
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
          onPress: () => {
            (async () => {
              try {
                await notificationSettingsService.resetSettings();
                const defaultSettings = notificationSettingsService.getDefaultSettings();
                setSettings(defaultSettings);
                Alert.alert('Success', 'Settings reset to defaults');
              } catch (error) {
                console.error('Error resetting settings:', error);
                Alert.alert('Error', 'Failed to reset settings');
              }
            })();
          },
        },
      ],
    );
  };

  const showTimePicker = (field: 'quietHoursStart' | 'quietHoursEnd') => {
    const _currentTime = notificationSettingsService.parseTimeString(settings[field]);

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
                void handleTimeChange(field, text);
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
      Alert.alert(
        'Time Picker',
        `Current time: ${settings[field]}\n\nTime picker UI will be implemented with a proper date/time picker component for Android.`,
        [{ text: 'OK' }],
      );
    }
  };

  if (loading) {
    return (
      <View
        className="flex-1 justify-center items-center"
        style={{ backgroundColor: colors.primary }}
      >
        <AppText className="text-lg mt-24" style={{ color: colors.white }}>
          Loading settings...
        </AppText>
      </View>
    );
  }

  const isWithinQuietHours = notificationSettingsService.isWithinQuietHours(settings);

  return (
    <ScrollView className="flex-1" style={{ backgroundColor: colors.primary }}>
      <View className="pt-[70px] px-5 pb-10">
        {/* Header with Back Button */}
        <View className="flex-row items-center mb-2.5">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="p-1"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={28} color={colors.white} />
          </TouchableOpacity>
        </View>

        <AppText className="text-[30px] font-bold mb-7" style={{ color: colors.white }}>
          Notification Settings
        </AppText>

        {/* Permission Status */}
        {permissionStatus !== 'granted' && (
          <View className="bg-[#FEF3C7] p-4 rounded-xl mb-5">
            <AppText className="text-sm text-[#92400E] leading-5">
              ⚠️ Notifications are not enabled in your device settings. Please enable them to
              receive mantra reminders.
            </AppText>
          </View>
        )}

        {/* Enable/Disable Notifications */}
        <View className="bg-white rounded-xl p-5 mb-5">
          <View className="flex-row justify-between items-center">
            <View className="flex-1 mr-4">
              <AppText className="text-lg font-semibold text-[#333] mb-1">
                Enable Notifications
              </AppText>
              <AppText className="text-sm text-[#6B7280] leading-5">
                Receive reminders for your scheduled mantras
              </AppText>
            </View>
            <Switch
              testID="enable-notifications-switch"
              value={settings.enabled}
              onValueChange={handleToggleEnabled}
              trackColor={{ false: '#D1D5DB', true: colors.primary }}
              thumbColor={settings.enabled ? colors.white : '#F3F4F6'}
            />
          </View>
        </View>

        {/* Quiet Hours */}
        <View className="bg-white rounded-xl p-5 mb-5">
          <View className="flex-row justify-between items-center">
            <View className="flex-1 mr-4">
              <AppText className="text-lg font-semibold text-[#333] mb-1">
                Quiet Hours (Do Not Disturb)
              </AppText>
              <AppText className="text-sm text-[#6B7280] leading-5">
                Prevent notifications during specified hours
              </AppText>
            </View>
            <Switch
              testID="quiet-hours-switch"
              value={settings.quietHoursEnabled}
              onValueChange={handleToggleQuietHours}
              disabled={!settings.enabled}
              trackColor={{ false: '#D1D5DB', true: colors.primary }}
              thumbColor={settings.quietHoursEnabled ? colors.white : '#F3F4F6'}
            />
          </View>

          {settings.quietHoursEnabled && (
            <View className="flex-row mt-4 gap-3">
              <TouchableOpacity
                className="flex-1 bg-[#F3F4F6] p-4 rounded-lg items-center"
                onPress={() => showTimePicker('quietHoursStart')}
              >
                <AppText className="text-xs text-[#6B7280] mb-1">Start Time</AppText>
                <AppText className="text-xl font-bold text-[#333]">
                  {settings.quietHoursStart}
                </AppText>
              </TouchableOpacity>

              <TouchableOpacity
                className="flex-1 bg-[#F3F4F6] p-4 rounded-lg items-center"
                onPress={() => showTimePicker('quietHoursEnd')}
              >
                <AppText className="text-xs text-[#6B7280] mb-1">End Time</AppText>
                <AppText className="text-xl font-bold text-[#333]">
                  {settings.quietHoursEnd}
                </AppText>
              </TouchableOpacity>
            </View>
          )}

          {settings.quietHoursEnabled && isWithinQuietHours && (
            <View className="bg-[#DBEAFE] p-3 rounded-lg mt-3">
              <AppText className="text-sm text-[#1E40AF] leading-5">
                🌙 Currently within quiet hours. Notifications are paused.
              </AppText>
            </View>
          )}
        </View>

        {/* Test Notification */}
        <TouchableOpacity
          testID="test-notification-button"
          className="py-5 px-6 rounded-xl items-center mb-3"
          style={{
            backgroundColor: !settings.enabled ? '#D1D5DB' : colors.primaryDark,
          }}
          onPress={handleTestNotification}
          disabled={!settings.enabled}
        >
          <AppText className="text-[16px] font-semibold" style={{ color: colors.white }}>
            Send Test Notification
          </AppText>
        </TouchableOpacity>

        {/* Reset Settings */}
        <TouchableOpacity
          className="bg-transparent py-5 px-6 rounded-xl items-center border-2 mb-5"
          style={{ borderColor: colors.white }}
          onPress={handleResetSettings}
        >
          <AppText className="text-[16px] font-semibold" style={{ color: colors.white }}>
            Reset to Defaults
          </AppText>
        </TouchableOpacity>

        {/* Info Text */}
        <AppText
          className="text-sm opacity-80 text-center leading-[18px]"
          style={{ color: colors.white }}
        >
          Note: Notifications will respect your device's system settings and Do Not Disturb mode.
        </AppText>
      </View>
    </ScrollView>
  );
}
