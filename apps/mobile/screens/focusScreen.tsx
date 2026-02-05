import React, { useCallback, useState } from 'react';
import { Alert, View, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import MantraCarousel from '../components/carousel';
import { Mantra } from '../services/mantra.service';
import { reminderService } from '../services/reminder.service';
import { storage } from '../utils/storage';
import { useTheme } from '../context/ThemeContext';

export default function FocusScreen({ route, navigation }: any) {
  const { mantra, onLike, onSave } = route.params as {
    mantra: Mantra;
    onLike: (id: number) => void;
    onSave: (id: number) => void;
  };

  const { colors } = useTheme();
  const [mantraReminder, setMantraReminder] = useState<{
    reminder_id: number;
    status: string | null;
  } | null>(null);

  const loadReminders = useCallback(async () => {
    try {
      const token = await storage.getToken();
      if (!token) return;
      const res = await reminderService.getReminders(token);
      if (res.status === 'success') {
        const found = res.data.reminders.find((r) => r.mantra_id === mantra.mantra_id);
        setMantraReminder(found ? { reminder_id: found.reminder_id, status: found.status } : null);
      }
    } catch {
      // non-critical
    }
  }, [mantra.mantra_id]);

  useFocusEffect(
    useCallback(() => {
      loadReminders();
    }, [loadReminders]),
  );

  const handleJournal = (mantraId: number, mantraTitle: string) => {
    navigation.navigate('JournalEditor', { mantraId, mantraTitle });
  };

  const handleReminder = () => {
    if (!mantraReminder) {
      navigation.navigate('CreateReminder', { mantraId: mantra.mantra_id });
      return;
    }

    const isPaused = mantraReminder.status === 'paused';
    Alert.alert('Reminder', undefined, [
      {
        text: isPaused ? 'Resume' : 'Pause',
        onPress: () => {
          void (async () => {
            try {
              const token = await storage.getToken();
              if (!token) return;
              await reminderService.updateReminder(
                mantraReminder.reminder_id,
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
              await reminderService.deleteReminder(mantraReminder.reminder_id, token);
              loadReminders();
            } catch {
              Alert.alert('Error', 'Failed to delete reminder');
            }
          })();
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  return (
    <View className="flex-1" style={{ backgroundColor: colors.primary }}>
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        className="absolute z-20 p-2"
        style={{ top: 60, left: 20 }}
        testID="back-button"
        accessibilityRole="button"
      >
        <Ionicons name="chevron-back" size={32} color={colors.text} />
      </TouchableOpacity>

      {/* Reminder button next to journal */}
      <TouchableOpacity
        onPress={handleReminder}
        className="absolute z-20 p-2"
        style={{ top: 60, right: 60 }}
        testID="reminder-button"
        accessibilityRole="button"
      >
        <Ionicons
          name={mantraReminder ? 'notifications' : 'notifications-outline'}
          size={28}
          color={mantraReminder ? colors.secondary : colors.text}
        />
      </TouchableOpacity>

      {/* Journal button in top-right corner */}
      <TouchableOpacity
        onPress={() => handleJournal(mantra.mantra_id, mantra.title)}
        className="absolute z-20 p-2"
        style={{ top: 60, right: 20 }}
        testID="journal-button"
        accessibilityRole="button"
      >
        <Ionicons name="book-outline" size={28} color={colors.text} />
      </TouchableOpacity>

      <MantraCarousel
        item={mantra}
        onLike={onLike}
        onSave={onSave}
        onJournal={handleJournal}
        showButtons={false}
        isFocusMode={true}
      />
    </View>
  );
}
