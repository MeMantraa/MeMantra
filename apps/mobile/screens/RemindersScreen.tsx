import React, { useState, useCallback } from 'react';
import { View, TouchableOpacity, FlatList, Alert, ActivityIndicator } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../src/navigation/types';
import { storage } from '../utils/storage';
import { reminderService, Reminder } from '../services/reminder.service';
import { scheduleSuggestionsService } from '../services/schedule-suggestions.service';
import { useTheme } from '../context/ThemeContext';
import AppText from '../components/UI/textWrapper';

type RemindersNavProp = StackNavigationProp<RootStackParamList>;

function sortRemindersByStatus(reminders: Reminder[]): Reminder[] {
  const getStatusPriority = (status: Reminder['status']): number => {
    switch (status) {
      case 'active':
        return 0;
      case 'paused':
        return 1;
      case 'completed':
        return 2;
      default:
        return 99;
    }
  };

  return [...reminders].sort((a, b) => getStatusPriority(a.status) - getStatusPriority(b.status));
}

function formatFrequency(frequency: string | null): string {
  if (!frequency) return 'Unknown';
  return frequency.charAt(0).toUpperCase() + frequency.slice(1);
}

function formatTime(isoString: string | null): string {
  if (!isoString) return 'No time set';
  const date = new Date(isoString);
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatScheduleTimes(times: string[] | null): string {
  if (!times || times.length === 0) return 'No times set';
  return times.map((t) => scheduleSuggestionsService.formatTimeForDisplay(t)).join(', ');
}

export default function RemindersScreen() {
  const navigation = useNavigation<RemindersNavProp>();
  const { colors } = useTheme();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);

  const loadReminders = useCallback(async () => {
    try {
      setLoading(true);
      const token = await storage.getToken();
      if (!token) return;

      const response = await reminderService.getReminders(token);
      if (response.status === 'success') {
        setReminders(sortRemindersByStatus(response.data.reminders));
      }
    } catch (error) {
      console.error('Error loading reminders:', error);
      Alert.alert('Error', 'Failed to load reminders');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadReminders();
    }, [loadReminders]),
  );

  const handleToggleStatus = async (reminder: Reminder) => {
    try {
      const token = await storage.getToken();
      if (!token) return;

      const newStatus = reminder.status === 'active' ? 'paused' : 'active';
      await reminderService.updateReminder(reminder.reminder_id, { status: newStatus }, token);
      await loadReminders();
    } catch (error) {
      console.error('Error updating reminder:', error);
      Alert.alert('Error', 'Failed to update reminder');
    }
  };

  const handleDelete = (reminder: Reminder) => {
    Alert.alert('Delete Reminder', 'Are you sure you want to delete this reminder?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            try {
              const token = await storage.getToken();
              if (!token) return;
              await reminderService.deleteReminder(reminder.reminder_id, token);
              await loadReminders();
            } catch (error) {
              console.error('Error deleting reminder:', error);
              Alert.alert('Error', 'Failed to delete reminder');
            }
          })();
        },
      },
    ]);
  };

  const renderReminder = ({ item }: { item: Reminder }) => {
    const isMantra = item.mantra_id !== null;
    const isJournal = item.journal_id !== null;
    const typeLabel = isMantra ? 'Mantra' : isJournal ? 'Journal' : 'Collection';
    const typeIcon = isMantra ? 'leaf-outline' : isJournal ? 'book-outline' : 'folder-outline';
    const linkedName = isMantra
      ? item.mantra_title
      : isJournal
        ? item.journal_title
        : item.collection_name;
    const isActive = item.status === 'active';
    const isCompleted = item.status === 'completed';
    const isRoutine = item.frequency === 'routine';

    return (
      <View
        className="bg-white rounded-xl p-4 mb-3"
        style={isCompleted ? { opacity: 0.6 } : undefined}
      >
        {/* Header row: type badge + status badge */}
        <View className="flex-row justify-between items-center mb-3">
          <View
            className="flex-row items-center gap-2 px-2.5 py-1 rounded-xl"
            style={{ backgroundColor: colors.primaryDark + '22' }}
          >
            <Ionicons name={typeIcon as any} size={14} color={colors.primaryDark} />
            <AppText className="text-xs" style={{ color: colors.primaryDark }}>
              {typeLabel}
            </AppText>
          </View>

          <View
            className="px-2.5 py-1 rounded-xl"
            style={{
              backgroundColor: isActive ? colors.primaryDark + '22' : colors.secondary + '55',
            }}
          >
            <AppText
              className="text-xs"
              style={{ color: isActive ? colors.primaryDark : '#92400E' }}
            >
              {formatFrequency(item.status)}
            </AppText>
          </View>
        </View>

        {/* Linked name */}
        {linkedName ? (
          <AppText className="text-base text-[#333] mb-2.5" numberOfLines={2}>
            {linkedName}
          </AppText>
        ) : null}

        {/* Body: time / frequency info */}
        <View className="gap-2 mb-3">
          {isRoutine ? (
            <>
              <View className="flex-row items-center gap-2">
                <Ionicons name="time-outline" size={16} color="#6B7280" />
                <AppText className="text-[15px] text-[#333] flex-1">
                  {formatScheduleTimes(item.schedule_times)}
                </AppText>
              </View>
              <View className="flex-row items-center gap-2">
                <Ionicons name="calendar-outline" size={16} color="#6B7280" />
                <AppText className="text-sm text-[#6B7280]">
                  {scheduleSuggestionsService.formatDaysForDisplay(item.schedule_days)}
                </AppText>
              </View>
              {item.timezone && (
                <View className="flex-row items-center gap-2">
                  <Ionicons name="globe-outline" size={16} color="#6B7280" />
                  <AppText className="text-sm text-[#6B7280]">
                    {scheduleSuggestionsService.formatTimezoneDisplay(item.timezone)}
                  </AppText>
                </View>
              )}
            </>
          ) : (
            <>
              <View className="flex-row items-center gap-2">
                <Ionicons name="time-outline" size={16} color="#6B7280" />
                <AppText className="text-[15px] text-[#333] flex-1">
                  {formatTime(item.time)}
                </AppText>
              </View>
              <View className="flex-row items-center gap-2">
                <Ionicons name="repeat-outline" size={16} color="#6B7280" />
                <AppText className="text-sm text-[#6B7280]">
                  {formatFrequency(item.frequency)}
                </AppText>
              </View>
            </>
          )}
        </View>

        {/* Action row */}
        {!isCompleted && (
          <View className="flex-row border-t border-[#F3F4F6] pt-3 gap-4">
            <TouchableOpacity
              className="flex-row items-center gap-2"
              onPress={() => handleToggleStatus(item)}
            >
              <Ionicons
                name={isActive ? 'pause-outline' : 'play-outline'}
                size={20}
                color={colors.primaryDark}
              />
              <AppText className="text-sm" style={{ color: colors.primaryDark }}>
                {isActive ? 'Pause' : 'Resume'}
              </AppText>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-row items-center gap-2"
              onPress={() => handleDelete(item)}
            >
              <Ionicons name="trash-outline" size={20} color="#EF4444" />
              <AppText className="text-sm text-[#EF4444]">Delete</AppText>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <View className="flex-1" style={{ backgroundColor: colors.primary }}>
      {/* Top header area */}
      <View className="pt-[70px] px-5">
        <View className="flex-row items-center mb-2.5">
          <TouchableOpacity
            testID="back-button"
            onPress={() => navigation.goBack()}
            className="p-1"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={28} color={colors.text} />
          </TouchableOpacity>
        </View>

        <View className="flex-row justify-between items-center mb-5">
          <AppText className="text-[34px] font-bold" style={{ color: colors.text }}>
            Reminders
          </AppText>
          <TouchableOpacity
            testID="add-reminder-button"
            className="p-1"
            onPress={() => navigation.navigate('CreateReminder' as any)}
          >
            <Ionicons name="add-circle" size={36} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      {loading ? (
        <ActivityIndicator size="large" color={colors.text} className="mt-10" />
      ) : reminders.length === 0 ? (
        <View className="flex-1 justify-center items-center px-10">
          <Ionicons name="notifications-off-outline" size={64} color={colors.secondary} />
          <AppText className="text-[22px] font-bold mt-4 mb-2" style={{ color: colors.text }}>
            No reminders yet
          </AppText>
          <AppText
            className="text-[15px] text-center leading-[22px] mb-6 opacity-80"
            style={{ color: colors.text }}
          >
            Create a reminder to get notified about your favourite mantras, collections, or journal
            entries.
          </AppText>
          <TouchableOpacity
            className="py-3.5 px-8 rounded-xl"
            style={{ backgroundColor: colors.primaryDark }}
            onPress={() => navigation.navigate('CreateReminder' as any)}
          >
            <AppText className="text-base" style={{ color: colors.text }}>
              Create Reminder
            </AppText>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={reminders}
          keyExtractor={(item) => item.reminder_id.toString()}
          renderItem={renderReminder}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}
