import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../src/navigation/types';
import { storage } from '../utils/storage';
import { reminderService, Reminder } from '../services/reminder.service';

type RemindersNavProp = StackNavigationProp<RootStackParamList>;

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

export default function RemindersScreen() {
  const navigation = useNavigation<RemindersNavProp>();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);

  const loadReminders = useCallback(async () => {
    try {
      setLoading(true);
      const token = await storage.getToken();
      if (!token) return;

      const response = await reminderService.getReminders(token);
      if (response.status === 'success') {
        setReminders(response.data.reminders);
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
    const typeLabel = isMantra ? 'Mantra' : 'Collection';
    const linkedName = isMantra ? item.mantra_title : item.collection_name;
    const isActive = item.status === 'active';
    const isCompleted = item.status === 'completed';

    return (
      <View style={[styles.reminderCard, isCompleted && styles.completedCard]}>
        <View style={styles.reminderHeader}>
          <View style={styles.typeBadge}>
            <Ionicons
              name={isMantra ? 'leaf-outline' : 'folder-outline'}
              size={14}
              color="#8E9A86"
            />
            <Text style={styles.typeText}>{typeLabel}</Text>
          </View>
          <View style={[styles.statusBadge, isActive ? styles.activeBadge : styles.pausedBadge]}>
            <Text style={[styles.statusText, isActive ? styles.activeText : styles.pausedText]}>
              {formatFrequency(item.status)}
            </Text>
          </View>
        </View>

        {linkedName ? (
          <Text style={styles.linkedName} numberOfLines={2}>
            {linkedName}
          </Text>
        ) : null}

        <View style={styles.reminderBody}>
          <View style={styles.reminderInfo}>
            <Ionicons name="time-outline" size={16} color="#6B7280" />
            <Text style={styles.timeText}>{formatTime(item.time)}</Text>
          </View>
          <View style={styles.reminderInfo}>
            <Ionicons name="repeat-outline" size={16} color="#6B7280" />
            <Text style={styles.frequencyText}>{formatFrequency(item.frequency)}</Text>
          </View>
        </View>

        {!isCompleted && (
          <View style={styles.reminderActions}>
            <TouchableOpacity style={styles.actionButton} onPress={() => handleToggleStatus(item)}>
              <Ionicons
                name={isActive ? 'pause-outline' : 'play-outline'}
                size={20}
                color="#8E9A86"
              />
              <Text style={styles.actionText}>{isActive ? 'Pause' : 'Resume'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={() => handleDelete(item)}>
              <Ionicons name="trash-outline" size={20} color="#EF4444" />
              <Text style={[styles.actionText, { color: '#EF4444' }]}>Delete</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity
            testID="back-button"
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={28} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.titleRow}>
          <Text style={styles.title}>Reminders</Text>
          <TouchableOpacity
            testID="add-reminder-button"
            style={styles.addButton}
            onPress={() => navigation.navigate('CreateReminder' as any)}
          >
            <Ionicons name="add-circle" size={36} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#FFFFFF" style={styles.loader} />
      ) : reminders.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="notifications-off-outline" size={64} color="rgba(255,255,255,0.5)" />
          <Text style={styles.emptyTitle}>No reminders yet</Text>
          <Text style={styles.emptySubtitle}>
            Create a reminder to get notified about your favourite mantras or collections.
          </Text>
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => navigation.navigate('CreateReminder' as any)}
          >
            <Text style={styles.createButtonText}>Create Reminder</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={reminders}
          keyExtractor={(item) => item.reminder_id.toString()}
          renderItem={renderReminder}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  backButton: {
    padding: 4,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    fontFamily: 'Red_Hat_Text-Bold',
    color: 'white',
  },
  addButton: {
    padding: 4,
  },
  loader: {
    marginTop: 40,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  reminderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  completedCard: {
    opacity: 0.6,
  },
  reminderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F0F4EF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typeText: {
    fontSize: 12,
    fontFamily: 'Red_Hat_Text-SemiBold',
    color: '#8E9A86',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeBadge: {
    backgroundColor: '#DEF7EC',
  },
  pausedBadge: {
    backgroundColor: '#FEF3C7',
  },
  statusText: {
    fontSize: 12,
    fontFamily: 'Red_Hat_Text-SemiBold',
  },
  activeText: {
    color: '#03543F',
  },
  pausedText: {
    color: '#92400E',
  },
  linkedName: {
    fontSize: 16,
    fontFamily: 'Red_Hat_Text-SemiBold',
    color: '#333',
    marginBottom: 10,
  },
  reminderBody: {
    gap: 8,
    marginBottom: 12,
  },
  reminderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeText: {
    fontSize: 15,
    fontFamily: 'Red_Hat_Text-Regular',
    color: '#333',
  },
  frequencyText: {
    fontSize: 14,
    fontFamily: 'Red_Hat_Text-Regular',
    color: '#6B7280',
  },
  reminderActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 12,
    gap: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    fontSize: 14,
    fontFamily: 'Red_Hat_Text-SemiBold',
    color: '#8E9A86',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 22,
    fontFamily: 'Red_Hat_Text-Bold',
    color: 'white',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  createButton: {
    backgroundColor: '#8E9A86',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  createButtonText: {
    fontSize: 16,
    fontFamily: 'Red_Hat_Text-SemiBold',
    color: 'white',
  },
});
