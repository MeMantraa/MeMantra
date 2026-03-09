import React, { useState, useEffect } from 'react';
import {
  View,
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
import { engagementService } from '../services/engagement.service';
import { collectionService, Collection } from '../services/collection.service';
import {
  scheduleSuggestionsService,
  compareTimeSlots,
  dateToTimeSlot,
  hasTimeConflict,
} from '../services/schedule-suggestions.service';
import { useTheme } from '../context/ThemeContext';
import AppText from '../components/UI/textWrapper';

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

const DAYS_OF_WEEK = [
  { key: 'sun', label: 'S', day: 0 },
  { key: 'mon', label: 'M', day: 1 },
  { key: 'tue', label: 'T', day: 2 },
  { key: 'wed', label: 'W', day: 3 },
  { key: 'thu', label: 'T', day: 4 },
  { key: 'fri', label: 'F', day: 5 },
  { key: 'sat', label: 'S', day: 6 },
];

type ReminderType = 'mantra' | 'collection';

const TEMPLATES = scheduleSuggestionsService.getTemplates();
const DAY_PRESETS = scheduleSuggestionsService.getDayPresets();

export default function CreateReminderScreen() {
  const navigation = useNavigation<CreateReminderNavProp>();
  const route = useRoute<RouteProp<RootStackParamList, 'CreateReminder'>>();
  const { colors } = useTheme();

  const preselectedMantraId = (route.params as any)?.mantraId as number | undefined;
  const preselectedCollectionId = (route.params as any)?.collectionId as number | undefined;

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

  const [scheduleMode, setScheduleMode] = useState<ScheduleMode>('routine');

  const [time, setTime] = useState(new Date(Date.now() + 60 * 60 * 1000));
  const [frequency, setFrequency] = useState<SimpleFrequency>('daily');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [tempDate, setTempDate] = useState(time);

  const [scheduleTimes, setScheduleTimes] = useState<string[]>(['07:00']);
  const [scheduleDays, setScheduleDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [dayPreset, setDayPreset] = useState<DayPresetKey>('everyday');
  const [userTimezone] = useState(scheduleSuggestionsService.getDeviceTimezone());
  const [activeTimePickerIndex, setActiveTimePickerIndex] = useState<number | null>(null);
  const [tempTime, setTempTime] = useState(new Date());

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
          // ignore
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

  const clearPreview = () => {
    setShowPreview(false);
    setPreviewData(null);
  };

  const updateTimesAndClearPreview = (times: string[]) => {
    setScheduleTimes([...times].sort(compareTimeSlots));
    clearPreview();
  };

  const applyTimeSlotChange = (newTime: string, editIndex: number): boolean => {
    if (hasTimeConflict(scheduleTimes, newTime, editIndex)) {
      Alert.alert('Duplicate Time', 'This time is already in your schedule.');
      return false;
    }
    const updated = [...scheduleTimes];
    updated[editIndex] = newTime;
    updateTimesAndClearPreview(updated);
    return true;
  };

  const addTemplateTime = (templateTime: string) => {
    if (hasTimeConflict(scheduleTimes, templateTime)) return;
    if (scheduleTimes.length >= 5) {
      Alert.alert('Limit Reached', 'You can set up to 5 reminder times.');
      return;
    }
    updateTimesAndClearPreview([...scheduleTimes, templateTime]);
  };

  const removeTime = (index: number) => {
    if (scheduleTimes.length <= 1) {
      Alert.alert('At Least One', 'You need at least one reminder time.');
      return;
    }
    setScheduleTimes(scheduleTimes.filter((_, i) => i !== index));
    clearPreview();
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
        applyTimeSlotChange(dateToTimeSlot(selected), activeTimePickerIndex);
      }
    } else if (selected) {
      setTempTime(selected);
    }
  };

  const confirmRoutineTimePicker = () => {
    if (activeTimePickerIndex !== null) {
      if (!applyTimeSlotChange(dateToTimeSlot(tempTime), activeTimePickerIndex)) {
        setActiveTimePickerIndex(null);
        return;
      }
    }
    setActiveTimePickerIndex(null);
  };

  const addNewTimeSlot = () => {
    if (scheduleTimes.length >= 5) {
      Alert.alert('Limit Reached', 'You can set up to 5 reminder times.');
      return;
    }
    const defaults = ['12:00', '08:00', '18:00', '09:00', '15:00'];
    const newTime = defaults.find((t) => !hasTimeConflict(scheduleTimes, t)) ?? '12:00';
    if (hasTimeConflict(scheduleTimes, newTime)) {
      Alert.alert('Duplicate Time', 'This time is already in your schedule.');
      return;
    }
    updateTimesAndClearPreview([...scheduleTimes, newTime]);
  };

  const selectDayPreset = (preset: DayPresetKey) => {
    setDayPreset(preset);
    const found = DAY_PRESETS.find((p) => p.key === preset);
    if (found && preset !== 'custom') setScheduleDays(found.days);
    clearPreview();
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
    clearPreview();
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
          { ...target, time: time.toISOString(), frequency, status: 'active' },
          token,
        );
      }

      engagementService.trackEvent('reminder_create');
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

  // ── iOS modal helpers ──────────────────────────────────────────────────────

  const renderIOSPickerModal = (
    visible: boolean,
    mode: 'date' | 'time',
    onChange: (e: DateTimePickerEvent, d?: Date) => void,
  ) => (
    <Modal visible={visible} transparent animationType="slide">
      <View className="flex-1 justify-end bg-black/40">
        <View className="bg-white rounded-t-[20px] pb-7">
          <View className="flex-row justify-between items-center px-5 py-3.5 border-b border-[#F3F4F6]">
            <TouchableOpacity onPress={() => cancelIOSPicker(mode)}>
              <AppText className="text-base text-[#EF4444]">Cancel</AppText>
            </TouchableOpacity>
            <AppText className="text-[17px] text-[#333]">
              {mode === 'date' ? 'Select Date' : 'Select Time'}
            </AppText>
            <TouchableOpacity onPress={() => confirmIOSPicker(mode)}>
              <AppText className="text-base text-[#059669]">Done</AppText>
            </TouchableOpacity>
          </View>
          <DateTimePicker
            value={tempDate}
            mode={mode}
            display="spinner"
            minimumDate={mode === 'date' ? new Date() : undefined}
            onChange={onChange}
            style={{ backgroundColor: 'white' }}
          />
        </View>
      </View>
    </Modal>
  );

  const renderRoutineTimePickerModal = () => (
    <Modal visible={activeTimePickerIndex !== null} transparent animationType="slide">
      <View className="flex-1 justify-end bg-black/40">
        <View className="bg-white rounded-t-[20px] pb-7">
          <View className="flex-row justify-between items-center px-5 py-3.5 border-b border-[#F3F4F6]">
            <TouchableOpacity onPress={() => setActiveTimePickerIndex(null)}>
              <AppText className="text-base text-[#EF4444]">Cancel</AppText>
            </TouchableOpacity>
            <AppText className="text-[17px] text-[#333]">Select Time</AppText>
            <TouchableOpacity onPress={confirmRoutineTimePicker}>
              <AppText className="text-base text-[#059669]">Done</AppText>
            </TouchableOpacity>
          </View>
          <DateTimePicker
            value={tempTime}
            mode="time"
            display="spinner"
            onChange={onRoutineTimeChange}
            style={{ backgroundColor: 'white' }}
          />
        </View>
      </View>
    </Modal>
  );

  const Section = ({ children }: { children: React.ReactNode }) => (
    <View className="bg-white rounded-xl p-4 mb-4">{children}</View>
  );

  const SectionTitle = ({ children }: { children: React.ReactNode }) => (
    <AppText className="text-[17px] text-[#333] mb-3">{children}</AppText>
  );

  const TypeToggleButton = ({
    active,
    onPress,
    iconName,
    label,
  }: {
    active: boolean;
    onPress: () => void;
    iconName: string;
    label: string;
  }) => (
    <TouchableOpacity
      className="flex-1 flex-row items-center justify-center gap-2 py-3 rounded-xl border-2"
      style={{
        borderColor: colors.primaryDark,
        backgroundColor: active ? colors.primaryDark : 'transparent',
      }}
      onPress={onPress}
    >
      <Ionicons
        name={iconName as any}
        size={20}
        color={active ? colors.text : colors.primaryDark}
      />
      <AppText style={{ color: active ? colors.text : colors.primaryDark }}>{label}</AppText>
    </TouchableOpacity>
  );

  return (
    <ScrollView className="flex-1" style={{ backgroundColor: colors.primary }}>
      <View className="pt-[70px] px-5 pb-10">
        {/* Back button */}
        <View className="flex-row items-center mb-2.5">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="p-1"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            testID="back-button"
          >
            <Ionicons name="arrow-back" size={28} color={colors.text} />
          </TouchableOpacity>
        </View>

        <AppText
          className="text-[34px] font-bold mb-6"
          style={{ color: colors.text }}
          testID="screen-title"
        >
          Create Reminder
        </AppText>

        {/* ── Remind me about ── */}
        <Section>
          <SectionTitle>Remind me about</SectionTitle>
          <View className="flex-row gap-3">
            <TypeToggleButton
              active={reminderType === 'mantra'}
              iconName="leaf-outline"
              label="Mantra"
              onPress={() => {
                setReminderType('mantra');
                setSelectedCollectionId(undefined);
              }}
            />
            <TypeToggleButton
              active={reminderType === 'collection'}
              iconName="folder-outline"
              label="Collection"
              onPress={() => {
                setReminderType('collection');
                setSelectedMantraId(undefined);
              }}
            />
          </View>
        </Section>

        {/* ── Select item ── */}
        <Section>
          <SectionTitle>
            {reminderType === 'mantra' ? 'Select Mantra' : 'Select Collection'}
          </SectionTitle>

          {loadingItems ? (
            <ActivityIndicator size="small" color={colors.primaryDark} className="my-4" />
          ) : reminderType === 'mantra' ? (
            mantras.length === 0 ? (
              <AppText className="text-sm text-[#6B7280] italic text-center py-3">
                No saved mantras yet. Save a mantra to set a reminder.
              </AppText>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="max-h-[50px]"
              >
                {mantras.map((mantra) => (
                  <TouchableOpacity
                    key={mantra.mantra_id}
                    className="px-4 py-2 rounded-full mr-2"
                    style={{
                      backgroundColor:
                        selectedMantraId === mantra.mantra_id ? colors.primaryDark : '#F3F4F6',
                    }}
                    onPress={() => setSelectedMantraId(mantra.mantra_id)}
                  >
                    <AppText
                      className="text-sm max-w-[150px]"
                      style={{
                        color: selectedMantraId === mantra.mantra_id ? colors.text : '#333',
                      }}
                      numberOfLines={1}
                    >
                      {mantra.title}
                    </AppText>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )
          ) : collections.length === 0 ? (
            <AppText className="text-sm text-[#6B7280] italic text-center py-3">
              No collections yet. Create a collection first.
            </AppText>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="max-h-[50px]">
              {collections.map((collection) => (
                <TouchableOpacity
                  key={collection.collection_id}
                  className="px-4 py-2 rounded-full mr-2"
                  style={{
                    backgroundColor:
                      selectedCollectionId === collection.collection_id
                        ? colors.primaryDark
                        : '#F3F4F6',
                  }}
                  onPress={() => setSelectedCollectionId(collection.collection_id)}
                >
                  <AppText
                    className="text-sm max-w-[150px]"
                    style={{
                      color:
                        selectedCollectionId === collection.collection_id ? colors.text : '#333',
                    }}
                    numberOfLines={1}
                  >
                    {collection.name}
                  </AppText>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {selectedMantra && (
            <View
              className="flex-row items-center gap-2 mt-3 pt-3 border-t border-[#F3F4F6]"
              testID="selected-item-preview"
            >
              <Ionicons name="checkmark-circle" size={16} color={colors.primaryDark} />
              <AppText className="text-sm text-[#333] flex-1" numberOfLines={2}>
                {selectedMantra.title}
              </AppText>
            </View>
          )}
          {selectedCollection && (
            <View
              className="flex-row items-center gap-2 mt-3 pt-3 border-t border-[#F3F4F6]"
              testID="selected-item-preview"
            >
              <Ionicons name="checkmark-circle" size={16} color={colors.primaryDark} />
              <AppText className="text-sm text-[#333] flex-1" numberOfLines={1}>
                {selectedCollection.name}
              </AppText>
            </View>
          )}
        </Section>

        {/* ── Schedule type ── */}
        <Section>
          <SectionTitle>Schedule type</SectionTitle>
          <View className="flex-row gap-3">
            <TypeToggleButton
              active={scheduleMode === 'routine'}
              iconName="calendar-outline"
              label="Routine"
              onPress={() => setScheduleMode('routine')}
            />
            <TypeToggleButton
              active={scheduleMode === 'simple'}
              iconName="time-outline"
              label="Simple"
              onPress={() => setScheduleMode('simple')}
            />
          </View>
        </Section>

        {scheduleMode === 'routine' ? (
          <>
            {/* ── Quick templates ── */}
            <Section>
              <SectionTitle>Quick templates</SectionTitle>
              <View className="flex-row gap-2">
                {TEMPLATES.map((tmpl) => {
                  const isAdded = scheduleTimes.includes(tmpl.times[0]);
                  return (
                    <TouchableOpacity
                      key={tmpl.name}
                      className="flex-1 items-center py-2.5 px-2 rounded-xl border-2 gap-1"
                      style={{
                        borderColor: isAdded ? colors.primaryDark : '#E5E7EB',
                        backgroundColor: isAdded ? colors.primaryDark : 'transparent',
                      }}
                      onPress={() => addTemplateTime(tmpl.times[0])}
                      disabled={isAdded}
                    >
                      <Ionicons
                        name={tmpl.icon as any}
                        size={18}
                        color={isAdded ? colors.text : colors.primaryDark}
                      />
                      <AppText
                        className="text-xs"
                        style={{ color: isAdded ? colors.text : '#333' }}
                      >
                        {tmpl.name}
                      </AppText>
                      <AppText
                        className="text-[11px]"
                        style={{ color: isAdded ? 'rgba(255,255,255,0.8)' : '#6B7280' }}
                      >
                        {scheduleSuggestionsService.formatTimeForDisplay(tmpl.times[0])}
                      </AppText>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </Section>

            {/* ── Reminder times ── */}
            <Section>
              <SectionTitle>Reminder times ({scheduleTimes.length}/5)</SectionTitle>
              {scheduleTimes.map((t, index) => (
                <View key={`${t}-${index}`} className="flex-row items-center mb-2">
                  <TouchableOpacity
                    className="flex-1 flex-row items-center gap-2 bg-[#F3F4F6] py-3 px-4 rounded-xl"
                    onPress={() => openRoutineTimePicker(index)}
                  >
                    <Ionicons name="time-outline" size={20} color={colors.primaryDark} />
                    <AppText className="text-base text-[#333]">
                      {scheduleSuggestionsService.formatTimeForDisplay(t)}
                    </AppText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="p-2"
                    style={{ padding: 8 }}
                    onPress={() => removeTime(index)}
                  >
                    <Ionicons name="close-circle" size={24} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              ))}
              {scheduleTimes.length < 5 && (
                <TouchableOpacity
                  className="flex-row items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed border-[#E5E7EB]"
                  onPress={addNewTimeSlot}
                >
                  <Ionicons name="add-circle-outline" size={20} color={colors.primaryDark} />
                  <AppText className="text-sm" style={{ color: colors.primaryDark }}>
                    Add time
                  </AppText>
                </TouchableOpacity>
              )}
            </Section>

            {/* ── Repeat days ── */}
            <Section>
              <SectionTitle>Repeat days</SectionTitle>
              <View className="flex-row flex-wrap gap-2 mb-1">
                {DAY_PRESETS.map((preset) => (
                  <TouchableOpacity
                    key={preset.key}
                    className="px-4 py-2 rounded-full border-2"
                    style={{
                      borderColor: dayPreset === preset.key ? colors.primaryDark : '#E5E7EB',
                      backgroundColor:
                        dayPreset === preset.key ? colors.primaryDark : 'transparent',
                    }}
                    onPress={() => selectDayPreset(preset.key)}
                  >
                    <AppText
                      className="text-[13px]"
                      style={{ color: dayPreset === preset.key ? colors.text : '#6B7280' }}
                    >
                      {preset.name}
                    </AppText>
                  </TouchableOpacity>
                ))}
              </View>
              {dayPreset === 'custom' && (
                <View className="flex-row justify-between mt-3">
                  {DAYS_OF_WEEK.map(({ key, label, day }) => (
                    <TouchableOpacity
                      key={key}
                      testID={`day-circle-${key}`}
                      className="w-10 h-10 rounded-full items-center justify-center border-2"
                      style={{
                        borderColor: scheduleDays.includes(day) ? colors.primaryDark : '#E5E7EB',
                        backgroundColor: scheduleDays.includes(day)
                          ? colors.primaryDark
                          : 'transparent',
                      }}
                      onPress={() => toggleDay(day)}
                    >
                      <AppText
                        className="text-sm"
                        style={{ color: scheduleDays.includes(day) ? colors.text : '#6B7280' }}
                      >
                        {label}
                      </AppText>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </Section>

            {/* ── Timezone ── */}
            <Section>
              <View className="flex-row items-center gap-2">
                <Ionicons name="globe-outline" size={20} color="#6B7280" />
                <AppText className="text-sm text-[#6B7280]">
                  {scheduleSuggestionsService.formatTimezoneDisplay(userTimezone)}
                </AppText>
              </View>
            </Section>

            {/* ── Preview button ── */}
            <TouchableOpacity
              className="flex-row items-center justify-center gap-2 bg-white rounded-xl py-3.5 mb-4 border-2"
              style={{ borderColor: colors.primaryDark }}
              onPress={fetchPreview}
              disabled={loadingPreview}
            >
              {loadingPreview ? (
                <ActivityIndicator size="small" color={colors.primaryDark} />
              ) : (
                <>
                  <Ionicons name="eye-outline" size={20} color={colors.primaryDark} />
                  <AppText className="text-[15px]" style={{ color: colors.primaryDark }}>
                    Preview schedule
                  </AppText>
                </>
              )}
            </TouchableOpacity>

            {/* ── Preview results ── */}
            {showPreview && previewData && (
              <Section>
                <SectionTitle>
                  {previewData.total_notifications_per_week} notifications per week
                </SectionTitle>
                {previewData.preview.map((day) => (
                  <View
                    key={day.date}
                    className="flex-row justify-between items-center py-2 border-b border-[#F3F4F6]"
                  >
                    <AppText className="text-sm text-[#333]">{day.day}</AppText>
                    <AppText className="text-[13px] text-[#6B7280]">
                      {day.times
                        .map((t) => scheduleSuggestionsService.formatTimeForDisplay(t))
                        .join(', ')}
                    </AppText>
                  </View>
                ))}
              </Section>
            )}
          </>
        ) : (
          <>
            {/* ── Simple: When ── */}
            <Section>
              <SectionTitle>When</SectionTitle>
              <View className="flex-row gap-3">
                <TouchableOpacity
                  testID="date-picker-button"
                  className="flex-1 flex-row items-center justify-center gap-2 bg-[#F3F4F6] py-3.5 rounded-xl"
                  onPress={openDatePicker}
                >
                  <Ionicons name="calendar-outline" size={20} color={colors.primaryDark} />
                  <AppText className="text-[15px] text-[#333]">
                    {time.toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </AppText>
                </TouchableOpacity>
                <TouchableOpacity
                  testID="time-picker-button"
                  className="flex-1 flex-row items-center justify-center gap-2 bg-[#F3F4F6] py-3.5 rounded-xl"
                  onPress={openSimpleTimePicker}
                >
                  <Ionicons name="time-outline" size={20} color={colors.primaryDark} />
                  <AppText className="text-[15px] text-[#333]">
                    {time.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                  </AppText>
                </TouchableOpacity>
              </View>
            </Section>

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

            {/* ── Simple: How often ── */}
            <Section>
              <SectionTitle>How often</SectionTitle>
              <View className="flex-row flex-wrap gap-2.5">
                {SIMPLE_FREQUENCIES.map((freq) => (
                  <TouchableOpacity
                    key={freq.value}
                    className="px-5 py-2.5 rounded-full border-2"
                    style={{
                      borderColor: frequency === freq.value ? colors.primaryDark : '#E5E7EB',
                      backgroundColor:
                        frequency === freq.value ? colors.primaryDark : 'transparent',
                    }}
                    onPress={() => setFrequency(freq.value)}
                  >
                    <AppText
                      className="text-sm"
                      style={{ color: frequency === freq.value ? colors.text : '#6B7280' }}
                    >
                      {freq.label}
                    </AppText>
                  </TouchableOpacity>
                ))}
              </View>
            </Section>
          </>
        )}

        {/* Android routine time picker */}
        {Platform.OS === 'android' && activeTimePickerIndex !== null && (
          <DateTimePicker
            value={tempTime}
            mode="time"
            display="default"
            onChange={onRoutineTimeChange}
          />
        )}
        {/* iOS routine time picker */}
        {Platform.OS === 'ios' && renderRoutineTimePickerModal()}

        {/* ── Submit ── */}
        <TouchableOpacity
          className="py-4 rounded-xl items-center mt-2"
          style={{
            backgroundColor: submitting ? '#D1D5DB' : colors.primaryDark,
          }}
          onPress={handleSubmit}
          disabled={submitting}
          testID="create-reminder-button"
        >
          {submitting ? (
            <ActivityIndicator size="small" color={colors.text} />
          ) : (
            <AppText className="text-lg" style={{ color: colors.text }}>
              Create Reminder
            </AppText>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
