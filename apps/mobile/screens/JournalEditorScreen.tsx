import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import AppText from '../components/UI/textWrapper';
import {
  journalService,
  MoodType,
  MOOD_OPTIONS,
  CreateJournalPayload,
  UpdateJournalPayload,
} from '../services/journal.service';
import { storage } from '../utils/storage';

export default function JournalEditorScreen({ navigation, route }: any) {
  const { colors } = useTheme();
  const existingEntry = route.params?.entry;
  const preselectedMantraId = route.params?.mantraId;
  const preselectedMantraTitle = route.params?.mantraTitle;
  const isEditing = !!existingEntry;

  const [title, setTitle] = useState(existingEntry?.title || '');
  const [content, setContent] = useState(existingEntry?.content || '');
  const [mood, setMood] = useState<MoodType | null>(existingEntry?.mood || null);
  const [tags, setTags] = useState<string[]>(existingEntry?.tags || []);
  const [tagInput, setTagInput] = useState('');
  const [mantraId, setMantraId] = useState<number | null>(
    existingEntry?.mantra_id || preselectedMantraId || null,
  );
  const [mantraTitle, setMantraTitle] = useState<string | null>(
    existingEntry?.mantra_title || preselectedMantraTitle || null,
  );
  const [saving, setSaving] = useState(false);

  const handleAddTag = () => {
    const trimmedTag = tagInput.trim().toLowerCase();
    if (trimmedTag && !tags.includes(trimmedTag) && tags.length < 10) {
      setTags([...tags, trimmedTag]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleSave = async () => {
    if (!content.trim()) {
      Alert.alert('Required', 'Please write some content for your journal entry');
      return;
    }

    setSaving(true);

    try {
      const token = (await storage.getToken()) || '';
      if (!token) {
        navigation.navigate('Login');
        return;
      }

      if (isEditing && existingEntry) {
        const payload: UpdateJournalPayload = {
          title: title.trim() || undefined,
          content: content.trim(),
          mood: mood || undefined,
          tags: tags.length > 0 ? tags : undefined,
          mantra_id: mantraId,
        };

        const response = await journalService.updateJournalEntry(
          existingEntry.journal_id,
          payload,
          token,
        );

        if (response.status === 'success') {
          Alert.alert('Success', 'Journal entry updated', [
            { text: 'OK', onPress: () => navigation.goBack() },
          ]);
        } else {
          Alert.alert('Error', response.message || 'Failed to update entry');
        }
      } else {
        const payload: CreateJournalPayload = {
          title: title.trim() || undefined,
          content: content.trim(),
          mood: mood || undefined,
          tags: tags.length > 0 ? tags : undefined,
          mantra_id: mantraId,
        };

        const response = await journalService.createJournalEntry(payload, token);

        if (response.status === 'success') {
          Alert.alert('Success', 'Journal entry saved', [
            { text: 'OK', onPress: () => navigation.goBack() },
          ]);
        } else {
          Alert.alert('Error', response.message || 'Failed to save entry');
        }
      }
    } catch (err) {
      console.error('Error saving journal entry:', err);
      Alert.alert('Error', 'Failed to save journal entry');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1"
      style={{ backgroundColor: colors.primary }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View className="pt-16 pb-4 px-5 flex-row items-center justify-between">
        <TouchableOpacity
          testID="back-button"
          onPress={() => navigation.goBack()}
          className="p-1"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close" size={28} color={colors.text} />
        </TouchableOpacity>
        <AppText className="text-xl font-bold" style={{ color: colors.text }}>
          {isEditing ? 'Edit Entry' : 'New Entry'}
        </AppText>
        <TouchableOpacity
          testID="save-button"
          onPress={handleSave}
          disabled={saving || !content.trim()}
          className="px-4 py-2 rounded-full"
          style={{
            backgroundColor: content.trim() ? colors.secondary : colors.primaryDark,
          }}
        >
          {saving ? (
            <ActivityIndicator size="small" color={colors.primaryDark} />
          ) : (
            <AppText
              className="font-bold"
              style={{
                color: content.trim() ? colors.primaryDark : colors.text,
                opacity: content.trim() ? 1 : 0.5,
              }}
            >
              Save
            </AppText>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-5" keyboardShouldPersistTaps="handled">
        {/* Linked Mantra */}
        {mantraTitle && (
          <View
            className="flex-row items-center p-3 rounded-xl mb-4"
            style={{ backgroundColor: colors.primaryDark }}
          >
            <Ionicons name="leaf-outline" size={18} color={colors.secondary} />
            <AppText
              className="text-sm ml-2 flex-1"
              style={{ color: colors.secondary }}
              numberOfLines={1}
            >
              Reflecting on: {mantraTitle}
            </AppText>
            <TouchableOpacity
              testID="remove-mantra-button"
              onPress={() => {
                setMantraId(null);
                setMantraTitle(null);
              }}
            >
              <Ionicons
                name="close-circle"
                size={20}
                color={colors.text}
                style={{ opacity: 0.5 }}
              />
            </TouchableOpacity>
          </View>
        )}

        {/* Title Input */}
        <TextInput
          className="text-2xl font-bold mb-4"
          style={{ color: colors.text }}
          placeholder="Title (optional)"
          placeholderTextColor={colors.text + '60'}
          value={title}
          onChangeText={setTitle}
          maxLength={255}
        />

        {/* Content Input */}
        <TextInput
          className="text-base leading-6 mb-6"
          style={{ color: colors.text, minHeight: 200 }}
          placeholder="What's on your mind? Reflect on your thoughts, feelings, and experiences..."
          placeholderTextColor={colors.text + '60'}
          value={content}
          onChangeText={setContent}
          multiline
          textAlignVertical="top"
        />

        {/* Mood Selection */}
        <View className="mb-6">
          <AppText className="text-sm font-bold mb-3" style={{ color: colors.text, opacity: 0.7 }}>
            How are you feeling?
          </AppText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {MOOD_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                testID={`mood-button-${option.value}`}
                className="items-center mr-3 p-2 rounded-xl"
                style={{
                  backgroundColor:
                    mood === option.value ? colors.secondary + '30' : colors.primaryDark,
                  borderWidth: mood === option.value ? 2 : 0,
                  borderColor: colors.secondary,
                }}
                onPress={() => setMood(mood === option.value ? null : option.value)}
              >
                <AppText className="text-2xl mb-1">{option.emoji}</AppText>
                <AppText
                  className="text-xs"
                  style={{ color: mood === option.value ? colors.secondary : colors.text }}
                >
                  {option.label}
                </AppText>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Tags */}
        <View className="mb-6">
          <AppText className="text-sm font-bold mb-3" style={{ color: colors.text, opacity: 0.7 }}>
            Tags
          </AppText>
          <View className="flex-row flex-wrap mb-2">
            {tags.map((tag, index) => (
              <TouchableOpacity
                key={index}
                className="flex-row items-center px-3 py-1 rounded-full mr-2 mb-2"
                style={{ backgroundColor: colors.secondary + '30' }}
                onPress={() => handleRemoveTag(tag)}
              >
                <AppText className="text-sm" style={{ color: colors.secondary }}>
                  #{tag}
                </AppText>
                <Ionicons
                  name="close"
                  size={14}
                  color={colors.secondary}
                  style={{ marginLeft: 4 }}
                />
              </TouchableOpacity>
            ))}
          </View>
          {tags.length < 10 && (
            <View className="flex-row items-center">
              <TextInput
                className="flex-1 px-3 py-2 rounded-lg"
                style={{ backgroundColor: colors.primaryDark, color: colors.text }}
                placeholder="Add a tag..."
                placeholderTextColor={colors.text + '60'}
                value={tagInput}
                onChangeText={setTagInput}
                onSubmitEditing={handleAddTag}
                returnKeyType="done"
                maxLength={50}
              />
              <TouchableOpacity
                className="ml-2 p-2 rounded-lg"
                style={{ backgroundColor: colors.secondary }}
                onPress={handleAddTag}
              >
                <Ionicons name="add" size={20} color={colors.primaryDark} />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Spacer for keyboard */}
        <View className="h-20" />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
