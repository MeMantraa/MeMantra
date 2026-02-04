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

type CreateReminderNavProp = StackNavigationProp<RootStackParamList>;

type Frequency = 'once' | 'daily' | 'weekly' | 'monthly';

const FREQUENCIES: { label: string; value: Frequency }[] = [
  { label: 'Once', value: 'once' },
  { label: 'Daily', value: 'daily' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Monthly', value: 'monthly' },
];

type ReminderType = 'mantra' | 'collection';

export default function CreateReminderScreen() {
  const navigation = useNavigation<CreateReminderNavProp>();
  const route = useRoute<RouteProp<RootStackParamList, 'CreateReminder'>>();

  const preselectedMantraId = (route.params as any)?.mantraId as number | undefined;
  const preselectedCollectionId = (route.params as any)?.collectionId as number | undefined;

  const [reminderType, setReminderType] = useState<ReminderType>(
    preselectedCollectionId ? 'collection' : 'mantra',
  );
  const [selectedMantraId, setSelectedMantraId] = useState<number | undefined>(preselectedMantraId);
  const [selectedCollectionId, setSelectedCollectionId] = useState<number | undefined>(
    preselectedCollectionId,
  );
  const [time, setTime] = useState(new Date(Date.now() + 60 * 60 * 1000));
  const [frequency, setFrequency] = useState<Frequency>('daily');
  const [submitting, setSubmitting] = useState(false);

  // Picker visibility — on Android each mode opens a native dialog,
  // on iOS we show an inline spinner inside a bottom-sheet modal.
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Temporary value while the iOS modal is open so the user can cancel
  const [tempDate, setTempDate] = useState(time);

  const [mantras, setMantras] = useState<Mantra[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);

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

      // If a mantra was preselected but isn't in the saved list, fetch it
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

  // ---- Date / Time handlers ----

  const openDatePicker = () => {
    setTempDate(time);
    setShowDatePicker(true);
  };

  const openTimePicker = () => {
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

  // ---- Submit ----

  const handleSubmit = async () => {
    if (reminderType === 'mantra' && !selectedMantraId) {
      Alert.alert('Select a Mantra', 'Please select a mantra for this reminder.');
      return;
    }
    if (reminderType === 'collection' && !selectedCollectionId) {
      Alert.alert('Select a Collection', 'Please select a collection for this reminder.');
      return;
    }
    if (time <= new Date()) {
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

      await reminderService.createReminder(
        {
          ...(reminderType === 'mantra'
            ? { mantra_id: selectedMantraId }
            : { collection_id: selectedCollectionId }),
          time: time.toISOString(),
          frequency,
          status: 'active',
        },
        token,
      );

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

  // ---- iOS picker modal (renders inline spinner with confirm/cancel) ----

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

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={28} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <Text style={styles.title}>Create Reminder</Text>

        {/* Reminder Type Selector */}
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

        {/* Item Selector */}
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
            <View style={styles.selectedPreview}>
              <Ionicons name="checkmark-circle" size={16} color="#8E9A86" />
              <Text style={styles.selectedPreviewText} numberOfLines={2}>
                {selectedMantra.title}
              </Text>
            </View>
          )}
          {selectedCollection && (
            <View style={styles.selectedPreview}>
              <Ionicons name="checkmark-circle" size={16} color="#8E9A86" />
              <Text style={styles.selectedPreviewText} numberOfLines={1}>
                {selectedCollection.name}
              </Text>
            </View>
          )}
        </View>

        {/* Date & Time */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>When</Text>
          <View style={styles.dateTimeRow}>
            <TouchableOpacity style={styles.dateTimeButton} onPress={openDatePicker}>
              <Ionicons name="calendar-outline" size={20} color="#8E9A86" />
              <Text style={styles.dateTimeText}>
                {time.toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.dateTimeButton} onPress={openTimePicker}>
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

        {/* Android pickers — rendered as native dialogs */}
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

        {/* iOS pickers — rendered in a bottom-sheet modal */}
        {Platform.OS === 'ios' && renderIOSPickerModal(showDatePicker, 'date', onDateChange)}
        {Platform.OS === 'ios' && renderIOSPickerModal(showTimePicker, 'time', onTimeChange)}

        {/* Frequency */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How often</Text>
          <View style={styles.frequencyGrid}>
            {FREQUENCIES.map((freq) => (
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

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
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
  // iOS picker modal styles
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
    fontSize: 16,
    color: '#6B7280',
  },
  modalDone: {
    fontSize: 16,
    fontFamily: 'Red_Hat_Text-SemiBold',
    color: '#8E9A86',
  },
  iosPicker: {
    height: 200,
  },
});
