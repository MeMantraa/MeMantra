import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  FlatList,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import AppText from '../components/UI/textWrapper';
import { journalService, JournalEntry, MOOD_OPTIONS } from '../services/journal.service';
import { storage } from '../utils/storage';
import { useFocusEffect } from '@react-navigation/native';

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function JournalScreen({ navigation }: any) {
  const { colors } = useTheme();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [totalEntries, setTotalEntries] = useState(0);

  useFocusEffect(
    useCallback(() => {
      loadJournalEntries();
    }, []),
  );

  const loadJournalEntries = async () => {
    try {
      const token = (await storage.getToken()) || '';
      if (!token) {
        navigation.navigate('Login');
        return;
      }

      const response = await journalService.getJournalEntries(token);

      if (response.status === 'success') {
        setEntries(response.data.entries);
        setTotalEntries(response.data.pagination?.total || response.data.entries.length);
      }
    } catch (err) {
      console.error('Error fetching journal entries:', err);
      Alert.alert('Error', 'Failed to load journal entries');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadJournalEntries();
  };

  const handleDeleteEntry = async (journalId: number) => {
    Alert.alert('Delete Entry', 'Are you sure you want to delete this journal entry?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const token = (await storage.getToken()) || '';
            const response = await journalService.deleteJournalEntry(journalId, token);
            if (response.status === 'success') {
              setEntries((prev) => prev.filter((e) => e.journal_id !== journalId));
              setTotalEntries((prev) => prev - 1);
            }
          } catch (err) {
            console.error('Error deleting journal entry:', err);
            Alert.alert('Error', 'Failed to delete journal entry');
          }
        },
      },
    ]);
  };

  const getMoodEmoji = (mood: string | null) => {
    if (!mood) return '';
    const moodOption = MOOD_OPTIONS.find((m) => m.value === mood);
    return moodOption?.emoji || '';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const renderEntry = ({ item }: { item: JournalEntry }) => (
    <TouchableOpacity
      className="rounded-xl p-4 mb-3 mx-4"
      style={{ backgroundColor: colors.primaryDark }}
      onPress={() => navigation.navigate('JournalDetail', { entry: item })}
      activeOpacity={0.8}
    >
      <View className="flex-row justify-between items-start mb-2">
        <View className="flex-1">
          <AppText className="text-lg font-bold" style={{ color: colors.text }} numberOfLines={1}>
            {item.title || 'Untitled Entry'}
          </AppText>
          <AppText className="text-xs mt-1" style={{ color: colors.text, opacity: 0.6 }}>
            {formatDate(item.created_at)}
          </AppText>
        </View>
        {item.mood && (
          <View className="ml-2">
            <AppText className="text-2xl">{getMoodEmoji(item.mood)}</AppText>
          </View>
        )}
      </View>

      <AppText
        className="text-sm leading-5 mb-2"
        style={{ color: colors.text, opacity: 0.85 }}
        numberOfLines={3}
      >
        {item.content}
      </AppText>

      {item.mantra_title && (
        <View
          className="flex-row items-center mt-2 p-2 rounded-lg"
          style={{ backgroundColor: colors.primary }}
        >
          <Ionicons name="leaf-outline" size={14} color={colors.secondary} />
          <AppText
            className="text-xs ml-2 flex-1"
            style={{ color: colors.secondary }}
            numberOfLines={1}
          >
            {item.mantra_title}
          </AppText>
        </View>
      )}

      {item.tags && item.tags.length > 0 && (
        <View className="flex-row flex-wrap mt-2">
          {item.tags.slice(0, 3).map((tag, index) => (
            <View
              key={index}
              className="px-2 py-1 rounded-full mr-1 mb-1"
              style={{ backgroundColor: colors.secondary + '30' }}
            >
              <AppText className="text-xs" style={{ color: colors.secondary }}>
                #{tag}
              </AppText>
            </View>
          ))}
          {item.tags.length > 3 && (
            <AppText className="text-xs self-center" style={{ color: colors.text, opacity: 0.6 }}>
              +{item.tags.length - 3} more
            </AppText>
          )}
        </View>
      )}

      <TouchableOpacity
        className="absolute top-3 right-3 p-1"
        onPress={() => handleDeleteEntry(item.journal_id)}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name="trash-outline" size={18} color={colors.text} style={{ opacity: 0.5 }} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View className="flex-1" style={{ backgroundColor: colors.primary }}>
        <View className="pt-16 pb-4 px-5 flex-row items-center justify-between">
          <AppText className="text-3xl font-bold" style={{ color: colors.text }}>
            Journal
          </AppText>
        </View>
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={colors.secondary} />
          <AppText className="mt-3 text-base" style={{ color: colors.text }}>
            Loading journal...
          </AppText>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1" style={{ backgroundColor: colors.primary }}>
      {/* Header */}
      <View className="pt-16 pb-4 px-5 flex-row items-center justify-between">
        <View>
          <AppText className="text-3xl font-bold" style={{ color: colors.text }}>
            Journal
          </AppText>
          <AppText className="text-sm mt-1" style={{ color: colors.text, opacity: 0.6 }}>
            {totalEntries} {totalEntries === 1 ? 'entry' : 'entries'}
          </AppText>
        </View>
        <TouchableOpacity
          className="w-12 h-12 rounded-full items-center justify-center"
          style={{ backgroundColor: colors.secondary }}
          onPress={() => navigation.navigate('JournalEditor')}
        >
          <Ionicons name="add" size={28} color={colors.primaryDark} />
        </TouchableOpacity>
      </View>

      {entries.length === 0 ? (
        <View className="flex-1 justify-center items-center px-10">
          <Ionicons name="book-outline" size={64} color={colors.secondary} />
          <AppText className="text-xl font-bold mt-4 mb-2" style={{ color: colors.text }}>
            Start Your Journal
          </AppText>
          <AppText
            className="text-base text-center leading-5 pt-2"
            style={{ color: colors.text, opacity: 0.7 }}
          >
            Reflect on mantras and capture your thoughts, feelings, and insights
          </AppText>
          <TouchableOpacity
            className="mt-6 px-6 py-3 rounded-full"
            style={{ backgroundColor: colors.secondary }}
            onPress={() => navigation.navigate('JournalEditor')}
          >
            <AppText className="text-base font-bold" style={{ color: colors.primaryDark }}>
              Write First Entry
            </AppText>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          testID="journal-list"
          data={entries}
          keyExtractor={(item) => item.journal_id.toString()}
          renderItem={renderEntry}
          contentContainerStyle={{ paddingVertical: 8 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.secondary}
              colors={[colors.secondary]}
            />
          }
        />
      )}
    </View>
  );
}
