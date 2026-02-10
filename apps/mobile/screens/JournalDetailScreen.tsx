import React from 'react';
import { View, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import AppText from '../components/UI/textWrapper';
import { MOOD_OPTIONS } from '../services/journal.service';
import { usePostHogScreen } from '../utils/posthog';
import { posthog } from '../services/posthog';

export default function JournalDetailScreen({ navigation, route }: any) {
  const { colors } = useTheme();
  usePostHogScreen();
  const { entry } = route.params;

  const getMoodInfo = (mood: string | null) => {
    if (!mood) return null;
    return MOOD_OPTIONS.find((m) => m.value === mood);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const moodInfo = getMoodInfo(entry.mood);

  return (
    <View className="flex-1" style={{ backgroundColor: colors.primary }}>
      {/* Header */}
      <View className="pt-16 pb-4 px-5 flex-row items-center justify-between">
        <TouchableOpacity
          testID="back-button"
          onPress={() => {
            posthog.capture('journal_detail_back_pressed', { journal_id: entry.journal_id });
            navigation.goBack();
          }}
          className="p-1"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={28} color={colors.text} />
        </TouchableOpacity>
        <TouchableOpacity
          testID="edit-button"
          onPress={() => {
            posthog.capture('journal_detail_edit_pressed', { journal_id: entry.journal_id });
            navigation.navigate('JournalEditor', { entry });
          }}
          className="p-1"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="create-outline" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-5">
        {/* Date and Time */}
        <View className="mb-4">
          <AppText className="text-sm" style={{ color: colors.text, opacity: 0.6 }}>
            {formatDate(entry.created_at)}
          </AppText>
          <AppText className="text-xs mt-1" style={{ color: colors.text, opacity: 0.4 }}>
            {formatTime(entry.created_at)}
          </AppText>
        </View>

        {/* Title */}
        <AppText className="text-3xl font-bold mb-4" style={{ color: colors.text }}>
          {entry.title || 'Untitled Entry'}
        </AppText>

        {/* Mood */}
        {moodInfo && (
          <View
            className="flex-row items-center p-3 rounded-xl mb-4 self-start"
            style={{ backgroundColor: colors.primaryDark }}
          >
            <AppText className="text-2xl mr-2">{moodInfo.emoji}</AppText>
            <AppText className="text-base" style={{ color: colors.text }}>
              Feeling {moodInfo.label.toLowerCase()}
            </AppText>
          </View>
        )}

        {/* Linked Mantra */}
        {entry.mantra_title && (
          <View
            className="flex-row items-center p-3 rounded-xl mb-4"
            style={{ backgroundColor: colors.secondary + '20' }}
          >
            <Ionicons name="leaf-outline" size={18} color={colors.secondary} />
            <View className="ml-3 flex-1">
              <AppText className="text-xs" style={{ color: colors.secondary, opacity: 0.7 }}>
                Reflecting on
              </AppText>
              <AppText className="text-sm font-bold" style={{ color: colors.secondary }}>
                {entry.mantra_title}
              </AppText>
              {entry.mantra_key_takeaway && (
                <AppText
                  className="text-xs mt-1"
                  style={{ color: colors.text, opacity: 0.7 }}
                  numberOfLines={2}
                >
                  {entry.mantra_key_takeaway}
                </AppText>
              )}
            </View>
          </View>
        )}

        {/* Content */}
        <AppText className="text-base leading-7 mb-6" style={{ color: colors.text }}>
          {entry.content}
        </AppText>

        {/* Tags */}
        {entry.tags && entry.tags.length > 0 && (
          <View className="mb-6">
            <AppText
              className="text-sm font-bold mb-2"
              style={{ color: colors.text, opacity: 0.7 }}
            >
              Tags
            </AppText>
            <View className="flex-row flex-wrap">
              {entry.tags.map((tag: string) => (
                <View
                  key={tag}
                  className="px-3 py-1 rounded-full mr-2 mb-2"
                  style={{ backgroundColor: colors.secondary + '30' }}
                >
                  <AppText className="text-sm" style={{ color: colors.secondary }}>
                    #{tag}
                  </AppText>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Last Updated */}
        {entry.updated_at !== entry.created_at && (
          <AppText className="text-xs mb-6" style={{ color: colors.text, opacity: 0.4 }}>
            Last edited: {formatDate(entry.updated_at)}
          </AppText>
        )}

        {/* Spacer */}
        <View className="h-10" />
      </ScrollView>
    </View>
  );
}
