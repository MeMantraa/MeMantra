import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../src/navigation/types';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { storage } from '../utils/storage';
import { reminderService } from '../services/reminder.service';
import { mantraService, Mantra } from '../services/mantra.service';
import { collectionService, Collection } from '../services/collection.service';
import { scheduleSuggestionsService } from '../services/schedule-suggestions.service';

type CreateReminderNavProp = StackNavigationProp<RootStackParamList>;

type SimpleFrequency = 'once' | 'daily' | 'weekly' | 'monthly';
type ScheduleMode = 'simple' | 'routine';
type DayPresetKey = 'everyday' | 'weekdays' | 'weekends' | 'custom';

const SIMPLE_FREQUENCIES: { label: string; value: SimpleFrequency }[] = [
  { label: 'Once', value: 'once' },
  { label: 'Daily', value: 'daily' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Monthly', value: 'monthly' },
];

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

type ReminderType = 'mantra' | 'collection';

const TEMPLATES = scheduleSuggestionsService.getTemplates();
const DAY_PRESETS = scheduleSuggestionsService.getDayPresets();

export default function CreateReminderScreen() {
  const navigation = useNavigation<CreateReminderNavProp>();
  const route = useRoute<RouteProp<RootStackParamList, 'CreateReminder'>>();

  const preselectedMantraId = (route.params as any)?.mantraId as number | undefined;
  const preselectedCollectionId = (route.params as any)?.collectionId as number | undefined;

  // Common state
  const [reminderType, setReminderType] = useState<ReminderType>(
    preselectedCollectionId ? 'collection' : 'mantra',
  );
  const [selectedMantraId, setSelectedMantraId] = useState<number | undefined>(preselectedMantraId);
  const [selectedCollectionId, setSelectedCollectionId] = useState<number | undefined>(
    preselectedCollectionId,
  );
  const [submitting, setSubmitting] = useState(false);
  const [mantras, setMantras] = useState<Mantra[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);

  // Schedule mode
  const [scheduleMode, setScheduleMode] = useState<ScheduleMode>('routine');

  // Simple mode state
  const [time, setTime] = useState(new Date(Date.now() + 60 * 60 * 1000));
  const [frequency, setFrequency] = useState<SimpleFrequency>('daily');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [tempDate, setTempDate] = useState(time);

  // Routine mode state
  const [scheduleTimes, setScheduleTimes] = useState<string[]>(['07:00']);
  const [scheduleDays, setScheduleDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [dayPreset, setDayPreset] = useState<DayPresetKey>('everyday');
  const [userTimezone] = useState(scheduleSuggestionsService.getDeviceTimezone());
  const [activeTimePickerIndex, setActiveTimePickerIndex] = useState<number | null>(null);
  const [tempTime, setTempTime] = useState(new Date());

  // Preview state
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<{
    preview: Array<{ day: string; date: string; times: string[] }>;
    total_notifications_per_week: number;
  } | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      const token = await storage.getToken();
      if (!token) return;

      const [savedMantras, collectionRes] = await Promise.all([
        mantraService.getSavedMantras(token),
        collectionService.getUserCollections(token),
      ]);

      let mantraList = Array.isArray(savedMantras) ? savedMantras : [];

      if (preselectedMantraId && !mantraList.some((m) => m.mantra_id === preselectedMantraId)) {
        try {
          const res = await mantraService.getMantraById(preselectedMantraId, token);
          if (res.status === 'success' && res.data?.mantra) {
            mantraList = [res.data.mantra, ...mantraList];
          }
        } catch {
          // Mantra may have been deleted; ignore
        }
      }

      setMantras(mantraList);
      if (collectionRes.data?.collections) {
        setCollections(collectionRes.data.collections);
      }
    } catch (error) {
      console.error('Error loading items:', error);
    } finally {
      setLoadingItems(false);
    }
  };

  // --- Simple mode date/time pickers ---

  const openDatePicker = () => {
    setTempDate(time);
    setShowDatePicker(true);
  };

  const openSimpleTimePicker = () => {
    setTempDate(time);
    setShowTimePicker(true);
  };

  const onDateChange = (_event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
      if (_event.type === 'set' && selected) {
        const updated = new Date(time);
        updated.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate());
        setTime(updated);
      }
    } else if (selected) {
      setTempDate(selected);
    }
  };

  const onTimeChange = (_event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
      if (_event.type === 'set' && selected) {
        const updated = new Date(time);
        updated.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
        setTime(updated);
      }
    } else if (selected) {
      setTempDate(selected);
    }
  };

  const confirmIOSPicker = (mode: 'date' | 'time') => {
    if (mode === 'date') {
      const updated = new Date(time);
      updated.setFullYear(tempDate.getFullYear(), tempDate.getMonth(), tempDate.getDate());
      setTime(updated);
      setShowDatePicker(false);
    } else {
      const updated = new Date(time);
      updated.setHours(tempDate.getHours(), tempDate.getMinutes(), 0, 0);
      setTime(updated);
      setShowTimePicker(false);
    }
  };

  const cancelIOSPicker = (mode: 'date' | 'time') => {
    if (mode === 'date') setShowDatePicker(false);
    else setShowTimePicker(false);
  };

  // --- Routine mode helpers ---

  const addTemplateTime = (templateTime: string) => {
    if (scheduleTimes.includes(templateTime)) return;
    if (scheduleTimes.length >= 5) {
      Alert.alert('Limit Reached', 'You can set up to 5 reminder times.');
      return;
    }
    setScheduleTimes([...scheduleTimes, templateTime].sort());
    setShowPreview(false);
    setPreviewData(null);
  };

  const removeTime = (index: number) => {
    if (scheduleTimes.length <= 1) {
      Alert.alert('At Least One', 'You need at least one reminder time.');
      return;
    }
    setScheduleTimes(scheduleTimes.filter((_, i) => i !== index));
    setShowPreview(false);
    setPreviewData(null);
  };

  const openRoutineTimePicker = (index: number) => {
    const [h, m] = scheduleTimes[index].split(':').map(Number);
    const d = new Date();
    d.setHours(h, m, 0, 0);
    setTempTime(d);
    setActiveTimePickerIndex(index);
  };

  const onRoutineTimeChange = (_event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') {
      setActiveTimePickerIndex(null);
      if (_event.type === 'set' && selected && activeTimePickerIndex !== null) {
        const hh = selected.getHours().toString().padStart(2, '0');
        const mm = selected.getMinutes().toString().padStart(2, '0');
        const newTime = `${hh}:${mm}`;
        const isDuplicate = scheduleTimes.some(
          (t, i) => t === newTime && i !== activeTimePickerIndex,
        );
        if (isDuplicate) {
          Alert.alert('Duplicate Time', 'This time is already in your schedule.');
          return;
        }
        const updated = [...scheduleTimes];
        updated[activeTimePickerIndex] = newTime;
        setScheduleTimes(updated.sort());
        setShowPreview(false);
        setPreviewData(null);
      }
    } else if (selected) {
      setTempTime(selected);
    }
  };

  const confirmRoutineTimePicker = () => {
    if (activeTimePickerIndex !== null) {
      const hh = tempTime.getHours().toString().padStart(2, '0');
      const mm = tempTime.getMinutes().toString().padStart(2, '0');
      const newTime = `${hh}:${mm}`;
      const isDuplicate = scheduleTimes.some(
        (t, i) => t === newTime && i !== activeTimePickerIndex,
      );
      if (isDuplicate) {
        Alert.alert('Duplicate Time', 'This time is already in your schedule.');
        setActiveTimePickerIndex(null);
        return;
      }
      const updated = [...scheduleTimes];
      updated[activeTimePickerIndex] = newTime;
      setScheduleTimes(updated.sort());
      setShowPreview(false);
      setPreviewData(null);
    }
    setActiveTimePickerIndex(null);
  };

  const addNewTimeSlot = () => {
    if (scheduleTimes.length >= 5) {
      Alert.alert('Limit Reached', 'You can set up to 5 reminder times.');
      return;
    }
    // Find a default time that isn't already used
    const defaults = ['12:00', '08:00', '18:00', '09:00', '15:00'];
    const newTime = defaults.find((t) => !scheduleTimes.includes(t)) ?? '12:00';
    if (scheduleTimes.includes(newTime)) {
      Alert.alert('Duplicate Time', 'This time is already in your schedule.');
      return;
    }
    setScheduleTimes([...scheduleTimes, newTime].sort());
    setShowPreview(false);
    setPreviewData(null);
  };

  const selectDayPreset = (preset: DayPresetKey) => {
    setDayPreset(preset);
    const found = DAY_PRESETS.find((p) => p.key === preset);
    if (found && preset !== 'custom') {
      setScheduleDays(found.days);
    }
    setShowPreview(false);
    setPreviewData(null);
  };

  const toggleDay = (day: number) => {
    const updated = scheduleDays.includes(day)
      ? scheduleDays.filter((d) => d !== day)
      : [...scheduleDays, day];
    if (updated.length === 0) {
      Alert.alert('At Least One', 'Select at least one day.');
      return;
    }
    setScheduleDays(updated);
    setDayPreset('custom');
    setShowPreview(false);
    setPreviewData(null);
  };

  const fetchPreview = async () => {
    try {
      setLoadingPreview(true);
      const token = await storage.getToken();
      if (!token) return;

      const response = await reminderService.getSchedulePreview(
        { schedule_times: scheduleTimes, schedule_days: scheduleDays, timezone: userTimezone },
        token,
      );

      if (response.status === 'success') {
        setPreviewData(response.data);
        setShowPreview(true);
      }
    } catch (error) {
      console.error('Error fetching preview:', error);
      Alert.alert('Error', 'Failed to load schedule preview.');
    } finally {
      setLoadingPreview(false);
    }
  };

  // --- Submit ---

  const handleSubmit = async () => {
    if (reminderType === 'mantra' && !selectedMantraId) {
      Alert.alert('Select a Mantra', 'Please select a mantra for this reminder.');
      return;
    }
    if (reminderType === 'collection' && !selectedCollectionId) {
      Alert.alert('Select a Collection', 'Please select a collection for this reminder.');
      return;
    }

    if (scheduleMode === 'simple' && time <= new Date()) {
      Alert.alert('Invalid Time', 'Reminder time must be in the future.');
      return;
    }

    try {
      setSubmitting(true);
      const token = await storage.getToken();
      if (!token) {
        Alert.alert('Error', 'Not authenticated.');
        return;
      }

      const target =
        reminderType === 'mantra'
          ? { mantra_id: selectedMantraId }
          : { collection_id: selectedCollectionId };

      if (scheduleMode === 'routine') {
        await reminderService.createReminder(
          {
            ...target,
            frequency: 'routine',
            schedule_times: scheduleTimes,
            schedule_days: scheduleDays,
            timezone: userTimezone,
            status: 'active',
          },
          token,
        );
      } else {
        await reminderService.createReminder(
          {
            ...target,
            time: time.toISOString(),
            frequency,
            status: 'active',
          },
          token,
        );
      }

      Alert.alert('Reminder Created', 'Your reminder has been set.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      console.error('Error creating reminder:', error);
      Alert.alert('Error', error?.response?.data?.message || 'Failed to create reminder.');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedMantra = mantras.find((m) => m.mantra_id === selectedMantraId);
  const selectedCollection = collections.find((c) => c.collection_id === selectedCollectionId);

  // --- Render helpers ---

  const renderIOSPickerModal = (
    visible: boolean,
    mode: 'date' | 'time',
    onChange: (e: DateTimePickerEvent, d?: Date) => void,
  ) => (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => cancelIOSPicker(mode)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{mode === 'date' ? 'Select Date' : 'Select Time'}</Text>
            <TouchableOpacity onPress={() => confirmIOSPicker(mode)}>
              <Text style={styles.modalDone}>Done</Text>
            </TouchableOpacity>
          </View>
          <DateTimePicker
            value={tempDate}
            mode={mode}
            display="spinner"
            minimumDate={mode === 'date' ? new Date() : undefined}
            onChange={onChange}
            style={styles.iosPicker}
          />
        </View>
      </View>
    </Modal>
  );

  const renderRoutineTimePickerModal = () => (
    <Modal visible={activeTimePickerIndex !== null} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setActiveTimePickerIndex(null)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Select Time</Text>
            <TouchableOpacity onPress={confirmRoutineTimePicker}>
              <Text style={styles.modalDone}>Done</Text>
            </TouchableOpacity>
          </View>
          <DateTimePicker
            value={tempTime}
            mode="time"
            display="spinner"
            onChange={onRoutineTimeChange}
            style={styles.iosPicker}
          />
        </View>
      </View>
    </Modal>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            testID="back-button"
          >
            <Ionicons name="arrow-back" size={28} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <Text style={styles.title} testID="screen-title">
          Create Reminder
        </Text>

        {/* Remind me about */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Remind me about</Text>
          <View style={styles.typeSelector}>
            <TouchableOpacity
              style={[styles.typeOption, reminderType === 'mantra' && styles.typeOptionActive]}
              onPress={() => {
                setReminderType('mantra');
                setSelectedCollectionId(undefined);
              }}
            >
              <Ionicons
                name="leaf-outline"
                size={20}
                color={reminderType === 'mantra' ? '#FFFFFF' : '#8E9A86'}
              />
              <Text
                style={[
                  styles.typeOptionText,
                  reminderType === 'mantra' && styles.typeOptionTextActive,
                ]}
              >
                Mantra
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.typeOption, reminderType === 'collection' && styles.typeOptionActive]}
              onPress={() => {
                setReminderType('collection');
                setSelectedMantraId(undefined);
              }}
            >
              <Ionicons
                name="folder-outline"
                size={20}
                color={reminderType === 'collection' ? '#FFFFFF' : '#8E9A86'}
              />
              <Text
                style={[
                  styles.typeOptionText,
                  reminderType === 'collection' && styles.typeOptionTextActive,
                ]}
              >
                Collection
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Select item */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {reminderType === 'mantra' ? 'Select Mantra' : 'Select Collection'}
          </Text>
          {loadingItems ? (
            <ActivityIndicator size="small" color="#8E9A86" style={{ marginVertical: 16 }} />
          ) : reminderType === 'mantra' ? (
            mantras.length === 0 ? (
              <Text style={styles.emptyText}>
                No saved mantras yet. Save a mantra to set a reminder.
              </Text>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.itemScroller}
              >
                {mantras.map((mantra) => (
                  <TouchableOpacity
                    key={mantra.mantra_id}
                    style={[
                      styles.itemChip,
                      selectedMantraId === mantra.mantra_id && styles.itemChipActive,
                    ]}
                    onPress={() => setSelectedMantraId(mantra.mantra_id)}
                  >
                    <Text
                      style={[
                        styles.itemChipText,
                        selectedMantraId === mantra.mantra_id && styles.itemChipTextActive,
                      ]}
                      numberOfLines={1}
                    >
                      {mantra.title}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )
          ) : collections.length === 0 ? (
            <Text style={styles.emptyText}>No collections yet. Create a collection first.</Text>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.itemScroller}
            >
              {collections.map((collection) => (
                <TouchableOpacity
                  key={collection.collection_id}
                  style={[
                    styles.itemChip,
                    selectedCollectionId === collection.collection_id && styles.itemChipActive,
                  ]}
                  onPress={() => setSelectedCollectionId(collection.collection_id)}
                >
                  <Text
                    style={[
                      styles.itemChipText,
                      selectedCollectionId === collection.collection_id &&
                        styles.itemChipTextActive,
                    ]}
                    numberOfLines={1}
                  >
                    {collection.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {selectedMantra && (
            <View style={styles.selectedPreview} testID="selected-item-preview">
              <Ionicons name="checkmark-circle" size={16} color="#8E9A86" />
              <Text style={styles.selectedPreviewText} numberOfLines={2}>
                {selectedMantra.title}
              </Text>
            </View>
          )}
          {selectedCollection && (
            <View style={styles.selectedPreview} testID="selected-item-preview">
              <Ionicons name="checkmark-circle" size={16} color="#8E9A86" />
              <Text style={styles.selectedPreviewText} numberOfLines={1}>
                {selectedCollection.name}
              </Text>
            </View>
          )}
        </View>

        {/* Schedule Mode Toggle */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Schedule type</Text>
          <View style={styles.typeSelector}>
            <TouchableOpacity
              style={[styles.typeOption, scheduleMode === 'routine' && styles.typeOptionActive]}
              onPress={() => setScheduleMode('routine')}
            >
              <Ionicons
                name="calendar-outline"
                size={20}
                color={scheduleMode === 'routine' ? '#FFFFFF' : '#8E9A86'}
              />
              <Text
                style={[
                  styles.typeOptionText,
                  scheduleMode === 'routine' && styles.typeOptionTextActive,
                ]}
              >
                Routine
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.typeOption, scheduleMode === 'simple' && styles.typeOptionActive]}
              onPress={() => setScheduleMode('simple')}
            >
              <Ionicons
                name="time-outline"
                size={20}
                color={scheduleMode === 'simple' ? '#FFFFFF' : '#8E9A86'}
              />
              <Text
                style={[
                  styles.typeOptionText,
                  scheduleMode === 'simple' && styles.typeOptionTextActive,
                ]}
              >
                Simple
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {scheduleMode === 'routine' ? (
          <>
            {/* Quick Templates */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Quick templates</Text>
              <View style={styles.templateRow}>
                {TEMPLATES.map((tmpl) => {
                  const isAdded = scheduleTimes.includes(tmpl.times[0]);
                  return (
                    <TouchableOpacity
                      key={tmpl.name}
                      style={[styles.templateChip, isAdded && styles.templateChipAdded]}
                      onPress={() => addTemplateTime(tmpl.times[0])}
                      disabled={isAdded}
                    >
                      <Ionicons
                        name={tmpl.icon as any}
                        size={18}
                        color={isAdded ? '#FFFFFF' : '#8E9A86'}
                      />
                      <Text
                        style={[styles.templateChipText, isAdded && styles.templateChipTextAdded]}
                      >
                        {tmpl.name}
                      </Text>
                      <Text
                        style={[styles.templateChipTime, isAdded && styles.templateChipTimeAdded]}
                      >
                        {scheduleSuggestionsService.formatTimeForDisplay(tmpl.times[0])}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Reminder Times */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Reminder times ({scheduleTimes.length}/5)</Text>
              {scheduleTimes.map((t, index) => (
                <View key={`${t}-${index}`} style={styles.timeSlotRow}>
                  <TouchableOpacity
                    style={styles.timeSlotButton}
                    onPress={() => {
                      if (Platform.OS === 'ios') {
                        openRoutineTimePicker(index);
                      } else {
                        openRoutineTimePicker(index);
                      }
                    }}
                  >
                    <Ionicons name="time-outline" size={20} color="#8E9A86" />
                    <Text style={styles.timeSlotText}>
                      {scheduleSuggestionsService.formatTimeForDisplay(t)}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.removeTimeButton}
                    onPress={() => removeTime(index)}
                  >
                    <Ionicons name="close-circle" size={24} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              ))}
              {scheduleTimes.length < 5 && (
                <TouchableOpacity style={styles.addTimeButton} onPress={addNewTimeSlot}>
                  <Ionicons name="add-circle-outline" size={20} color="#8E9A86" />
                  <Text style={styles.addTimeText}>Add time</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Repeat Days */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Repeat days</Text>
              <View style={styles.presetRow}>
                {DAY_PRESETS.map((preset) => (
                  <TouchableOpacity
                    key={preset.key}
                    style={[styles.presetChip, dayPreset === preset.key && styles.presetChipActive]}
                    onPress={() => selectDayPreset(preset.key)}
                  >
                    <Text
                      style={[
                        styles.presetChipText,
                        dayPreset === preset.key && styles.presetChipTextActive,
                      ]}
                    >
                      {preset.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {dayPreset === 'custom' && (
                <View style={styles.dayGrid}>
                  {DAY_LABELS.map((label, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.dayCircle,
                        scheduleDays.includes(index) && styles.dayCircleActive,
                      ]}
                      onPress={() => toggleDay(index)}
                    >
                      <Text
                        style={[
                          styles.dayCircleText,
                          scheduleDays.includes(index) && styles.dayCircleTextActive,
                        ]}
                      >
                        {label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Timezone */}
            <View style={styles.section}>
              <View style={styles.timezoneRow}>
                <Ionicons name="globe-outline" size={20} color="#6B7280" />
                <Text style={styles.timezoneText}>
                  {scheduleSuggestionsService.formatTimezoneDisplay(userTimezone)}
                </Text>
              </View>
            </View>

            {/* Preview */}
            <TouchableOpacity
              style={styles.previewButton}
              onPress={fetchPreview}
              disabled={loadingPreview}
            >
              {loadingPreview ? (
                <ActivityIndicator size="small" color="#8E9A86" />
              ) : (
                <>
                  <Ionicons name="eye-outline" size={20} color="#8E9A86" />
                  <Text style={styles.previewButtonText}>Preview schedule</Text>
                </>
              )}
            </TouchableOpacity>

            {showPreview && previewData && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  {previewData.total_notifications_per_week} notifications per week
                </Text>
                {previewData.preview.map((day) => (
                  <View key={day.date} style={styles.previewDay}>
                    <Text style={styles.previewDayLabel}>{day.day}</Text>
                    <Text style={styles.previewDayTimes}>
                      {day.times
                        .map((t) => scheduleSuggestionsService.formatTimeForDisplay(t))
                        .join(', ')}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </>
        ) : (
          <>
            {/* Simple mode: When */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>When</Text>
              <View style={styles.dateTimeRow}>
                <TouchableOpacity
                  testID="date-picker-button"
                  style={styles.dateTimeButton}
                  onPress={openDatePicker}
                >
                  <Ionicons name="calendar-outline" size={20} color="#8E9A86" />
                  <Text style={styles.dateTimeText}>
                    {time.toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  testID="time-picker-button"
                  style={styles.dateTimeButton}
                  onPress={openSimpleTimePicker}
                >
                  <Ionicons name="time-outline" size={20} color="#8E9A86" />
                  <Text style={styles.dateTimeText}>
                    {time.toLocaleTimeString(undefined, {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {Platform.OS === 'android' && showDatePicker && (
              <DateTimePicker
                value={time}
                mode="date"
                display="default"
                minimumDate={new Date()}
                onChange={onDateChange}
              />
            )}
            {Platform.OS === 'android' && showTimePicker && (
              <DateTimePicker value={time} mode="time" display="default" onChange={onTimeChange} />
            )}

            {Platform.OS === 'ios' && renderIOSPickerModal(showDatePicker, 'date', onDateChange)}
            {Platform.OS === 'ios' && renderIOSPickerModal(showTimePicker, 'time', onTimeChange)}

            {/* Simple mode: How often */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>How often</Text>
              <View style={styles.frequencyGrid}>
                {SIMPLE_FREQUENCIES.map((freq) => (
                  <TouchableOpacity
                    key={freq.value}
                    style={[
                      styles.frequencyOption,
                      frequency === freq.value && styles.frequencyOptionActive,
                    ]}
                    onPress={() => setFrequency(freq.value)}
                  >
                    <Text
                      style={[
                        styles.frequencyOptionText,
                        frequency === freq.value && styles.frequencyOptionTextActive,
                      ]}
                    >
                      {freq.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </>
        )}

        {/* Routine mode time picker (Android) */}
        {Platform.OS === 'android' && activeTimePickerIndex !== null && (
          <DateTimePicker
            value={tempTime}
            mode="time"
            display="default"
            onChange={onRoutineTimeChange}
          />
        )}

        {/* Routine mode time picker (iOS) */}
        {Platform.OS === 'ios' && renderRoutineTimePickerModal()}

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
          testID="create-reminder-button"
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.submitButtonText}>Create Reminder</Text>
          )}
        </TouchableOpacity>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    fontFamily: 'Red_Hat_Text-Bold',
    color: 'white',
    marginBottom: 24,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Red_Hat_Text-SemiBold',
    color: '#333',
    marginBottom: 12,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 12,
  },
  typeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#8E9A86',
  },
  typeOptionActive: {
    backgroundColor: '#8E9A86',
    borderColor: '#8E9A86',
  },
  typeOptionText: {
    fontSize: 15,
    fontFamily: 'Red_Hat_Text-SemiBold',
    color: '#8E9A86',
  },
  typeOptionTextActive: {
    color: '#FFFFFF',
  },
  itemScroller: {
    maxHeight: 50,
  },
  itemChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
  },
  itemChipActive: {
    backgroundColor: '#8E9A86',
  },
  itemChipText: {
    fontSize: 14,
    fontFamily: 'Red_Hat_Text-Regular',
    color: '#333',
    maxWidth: 150,
  },
  itemChipTextActive: {
    color: '#FFFFFF',
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 12,
  },
  selectedPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  selectedPreviewText: {
    fontSize: 14,
    fontFamily: 'Red_Hat_Text-Regular',
    color: '#333',
    flex: 1,
  },

  // Template styles
  templateRow: {
    flexDirection: 'row',
    gap: 8,
  },
  templateChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    gap: 4,
  },
  templateChipAdded: {
    backgroundColor: '#8E9A86',
    borderColor: '#8E9A86',
  },
  templateChipText: {
    fontSize: 12,
    fontFamily: 'Red_Hat_Text-SemiBold',
    color: '#333',
  },
  templateChipTextAdded: {
    color: '#FFFFFF',
  },
  templateChipTime: {
    fontSize: 11,
    fontFamily: 'Red_Hat_Text-Regular',
    color: '#6B7280',
  },
  templateChipTimeAdded: {
    color: 'rgba(255,255,255,0.8)',
  },

  // Time slot styles
  timeSlotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  timeSlotButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F3F4F6',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  timeSlotText: {
    fontSize: 16,
    fontFamily: 'Red_Hat_Text-SemiBold',
    color: '#333',
  },
  removeTimeButton: {
    padding: 8,
  },
  addTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  addTimeText: {
    fontSize: 14,
    fontFamily: 'Red_Hat_Text-SemiBold',
    color: '#8E9A86',
  },

  // Day preset styles
  presetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  presetChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  presetChipActive: {
    backgroundColor: '#8E9A86',
    borderColor: '#8E9A86',
  },
  presetChipText: {
    fontSize: 13,
    fontFamily: 'Red_Hat_Text-SemiBold',
    color: '#6B7280',
  },
  presetChipTextActive: {
    color: '#FFFFFF',
  },
  dayGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  dayCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  dayCircleActive: {
    backgroundColor: '#8E9A86',
    borderColor: '#8E9A86',
  },
  dayCircleText: {
    fontSize: 14,
    fontFamily: 'Red_Hat_Text-SemiBold',
    color: '#6B7280',
  },
  dayCircleTextActive: {
    color: '#FFFFFF',
  },

  // Timezone
  timezoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timezoneText: {
    fontSize: 14,
    fontFamily: 'Red_Hat_Text-Regular',
    color: '#6B7280',
  },

  // Preview
  previewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 14,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#8E9A86',
  },
  previewButtonText: {
    fontSize: 15,
    fontFamily: 'Red_Hat_Text-SemiBold',
    color: '#8E9A86',
  },
  previewDay: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  previewDayLabel: {
    fontSize: 14,
    fontFamily: 'Red_Hat_Text-SemiBold',
    color: '#333',
  },
  previewDayTimes: {
    fontSize: 13,
    fontFamily: 'Red_Hat_Text-Regular',
    color: '#6B7280',
  },

  // Simple mode styles
  dateTimeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dateTimeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#F3F4F6',
    paddingVertical: 14,
    borderRadius: 10,
  },
  dateTimeText: {
    fontSize: 15,
    fontFamily: 'Red_Hat_Text-Regular',
    color: '#333',
  },
  frequencyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  frequencyOption: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  frequencyOptionActive: {
    backgroundColor: '#8E9A86',
    borderColor: '#8E9A86',
  },
  frequencyOptionText: {
    fontSize: 14,
    fontFamily: 'Red_Hat_Text-SemiBold',
    color: '#6B7280',
  },
  frequencyOptionTextActive: {
    color: '#FFFFFF',
  },

  // Submit
  submitButton: {
    backgroundColor: '#6D7E68',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  submitButtonText: {
    fontSize: 18,
    fontFamily: 'Red_Hat_Text-SemiBold',
    color: '#FFFFFF',
  },

  // Modals
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 30,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalTitle: {
    fontSize: 17,
    fontFamily: 'Red_Hat_Text-SemiBold',
    color: '#333',
  },
  modalCancel: {
    color: '#EF4444',
    fontSize: 16,
    fontFamily: 'Red_Hat_Text-Regular',
  },
  modalDone: {
    color: '#059669',
    fontSize: 16,
    fontFamily: 'Red_Hat_Text-Bold',
  },
  iosPicker: {
    backgroundColor: 'white',
  },
});
