import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { reminderService } from '../services/reminder.service';
import { storage } from '../utils/storage';

export type ReminderInfo = { reminder_id: number; status: string | null };

export function useReminders() {
  const [remindersByMantra, setRemindersByMantra] = useState<Map<number, ReminderInfo>>(new Map());
  const [remindersByCollection, setRemindersByCollection] = useState<Map<number, ReminderInfo>>(
    new Map(),
  );
  const [remindersByJournal, setRemindersByJournal] = useState<Map<number, ReminderInfo>>(
    new Map(),
  );

  const loadReminders = useCallback(async () => {
    try {
      const token = await storage.getToken();
      if (!token) return;
      const res = await reminderService.getReminders(token);
      if (res.status === 'success') {
        const mantraMap = new Map<number, ReminderInfo>();
        const collectionMap = new Map<number, ReminderInfo>();
        const journalMap = new Map<number, ReminderInfo>();
        for (const r of res.data.reminders) {
          const info: ReminderInfo = { reminder_id: r.reminder_id, status: r.status };
          if (r.mantra_id !== null) {
            mantraMap.set(r.mantra_id, info);
          }
          if (r.collection_id !== null) {
            collectionMap.set(r.collection_id, info);
          }
          if (r.journal_id !== null) {
            journalMap.set(r.journal_id, info);
          }
        }
        setRemindersByMantra(mantraMap);
        setRemindersByCollection(collectionMap);
        setRemindersByJournal(journalMap);
      }
    } catch {
      Alert.alert('Error', 'Failed to load reminders. Please try again later.');
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadReminders();
    }, [loadReminders]),
  );

  const getReminderForMantra = useCallback(
    (mantraId: number): ReminderInfo | undefined => {
      return remindersByMantra.get(mantraId);
    },
    [remindersByMantra],
  );

  const getReminderForCollection = useCallback(
    (collectionId: number): ReminderInfo | undefined => {
      return remindersByCollection.get(collectionId);
    },
    [remindersByCollection],
  );

  const getReminderForJournal = useCallback(
    (journalId: number): ReminderInfo | undefined => {
      return remindersByJournal.get(journalId);
    },
    [remindersByJournal],
  );

  const showReminderActions = useCallback(
    (existing: ReminderInfo) => {
      const isPaused = existing.status === 'paused';
      Alert.alert('Reminder', undefined, [
        {
          text: isPaused ? 'Resume' : 'Pause',
          onPress: () => {
            void (async () => {
              try {
                const token = await storage.getToken();
                if (!token) return;
                await reminderService.updateReminder(
                  existing.reminder_id,
                  { status: isPaused ? 'active' : 'paused' },
                  token,
                );
                loadReminders();
              } catch {
                Alert.alert('Error', 'Failed to update reminder');
              }
            })();
          },
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              try {
                const token = await storage.getToken();
                if (!token) return;
                await reminderService.deleteReminder(existing.reminder_id, token);
                loadReminders();
              } catch {
                Alert.alert('Error', 'Failed to delete reminder');
              }
            })();
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]);
    },
    [loadReminders],
  );

  const handleReminderPress = useCallback(
    (type: 'mantra' | 'collection' | 'journal', id: number, navigation: any) => {
      const map =
        type === 'mantra'
          ? remindersByMantra
          : type === 'collection'
            ? remindersByCollection
            : remindersByJournal;
      const existing = map.get(id);
      if (existing) {
        showReminderActions(existing);
      } else {
        const params =
          type === 'mantra'
            ? { mantraId: id }
            : type === 'collection'
              ? { collectionId: id }
              : { journalId: id };
        navigation.navigate('CreateReminder', params);
      }
    },
    [remindersByMantra, remindersByCollection, remindersByJournal, showReminderActions],
  );

  return {
    remindersByMantra,
    remindersByCollection,
    remindersByJournal,
    getReminderForMantra,
    getReminderForCollection,
    getReminderForJournal,
    showReminderActions,
    handleReminderPress,
    refresh: loadReminders,
  };
}
