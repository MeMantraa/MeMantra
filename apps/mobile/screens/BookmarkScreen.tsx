import React, { useEffect, useState } from 'react';
import {
  View,
  FlatList,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import AppText from '../components/UI/textWrapper';
import { Mantra } from '../services/mantra.service';
import { collectionService } from '../services/collection.service';
import { storage } from '../utils/storage';
import { useReminders } from '../hooks/useReminders';

const SCREEN_WIDTH = Dimensions.get('window').width;
const ITEM_MARGIN = 12;
const NUM_COLUMNS = 2;
const ITEM_SIZE = (SCREEN_WIDTH - ITEM_MARGIN * (NUM_COLUMNS + 1)) / NUM_COLUMNS;

export default function BookmarkScreen({ navigation, route }: any) {
  const { colors } = useTheme();
  const { collectionId = 0, collectionName = '' } = route?.params ?? {};

  const [mantras, setMantras] = useState<Mantra[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { remindersByMantra, getReminderForCollection, handleReminderPress } = useReminders();
  const collectionReminder = getReminderForCollection(collectionId);

  useEffect(() => {
    loadCollectionMantras();
  }, [collectionId]);

  const loadCollectionMantras = async () => {
    try {
      const token = (await storage.getToken()) || 'mock-token';
      const response = await collectionService.getCollectionById(collectionId, token);

      if (response.status === 'success' && response.data) {
        setMantras(response.data.mantras);
      }
    } catch (err) {
      console.error('Error fetching collection mantras:', err);
      Alert.alert('Error', 'Failed to load mantras');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadCollectionMantras();
  };

  const handleMantraReminder = (mantraId: number) => {
    handleReminderPress('mantra', mantraId, navigation);
  };

  const handleCollectionReminder = () => {
    handleReminderPress('collection', collectionId, navigation);
  };

  const renderItem = ({ item }: { item: Mantra }) => (
    <View style={{ width: ITEM_SIZE, height: ITEM_SIZE * 0.75 }}>
      <TouchableOpacity
        className="justify-center items-center rounded-xl p-2.5 shadow-sm android:elevation-4"
        style={{
          backgroundColor: colors.primaryDark,
          width: ITEM_SIZE,
          height: ITEM_SIZE * 0.75,
        }}
        onPress={() =>
          navigation.navigate('Focus', {
            mantra: item,
          })
        }
      >
        <AppText
          className="text-lg font-bold text-center leading-tight"
          style={{ color: colors.text }}
          numberOfLines={3}
        >
          {item.title}
        </AppText>
      </TouchableOpacity>
      <TouchableOpacity
        testID={`mantra-reminder-${item.mantra_id}`}
        className="absolute bottom-2 right-2 p-1"
        onPress={() => handleMantraReminder(item.mantra_id)}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons
          name={remindersByMantra.has(item.mantra_id) ? 'notifications' : 'notifications-outline'}
          size={18}
          color={remindersByMantra.has(item.mantra_id) ? colors.secondary : colors.text}
        />
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View className="flex-1" style={{ backgroundColor: colors.primary }}>
        <View
          className="pt-16 pb-4 px-5 flex-row items-center"
          style={{ backgroundColor: colors.primary }}
        >
          <TouchableOpacity
            testID="back-button-empty"
            onPress={() => navigation.goBack()}
            className="mr-3 p-1"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={28} color={colors.text} />
          </TouchableOpacity>
          <AppText
            className="text-3xl font-bold flex-1"
            style={{ color: colors.text }}
            numberOfLines={1}
          >
            {collectionName}
          </AppText>
        </View>
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={colors.secondary} />
          <AppText className="mt-3 text-base" style={{ color: colors.text }}>
            Loading mantras...
          </AppText>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1" style={{ backgroundColor: colors.primary }}>
      <View
        className="pt-16 pb-4 px-5 flex-row items-center"
        style={{ backgroundColor: colors.primary }}
      >
        <TouchableOpacity
          testID="back-button"
          onPress={() => navigation.goBack()}
          className="mr-3 p-1"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={28} color={colors.text} />
        </TouchableOpacity>
        <AppText
          className="text-3xl font-bold flex-1"
          style={{ color: colors.text }}
          numberOfLines={1}
        >
          {collectionName}
        </AppText>
        <TouchableOpacity
          testID="collection-reminder-button"
          onPress={handleCollectionReminder}
          className="ml-2 p-1"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons
            name={collectionReminder ? 'notifications' : 'notifications-outline'}
            size={24}
            color={collectionReminder ? colors.secondary : colors.text}
          />
        </TouchableOpacity>
      </View>

      {mantras.length === 0 ? (
        <View className="flex-1 justify-center items-center px-10">
          <Ionicons name="bookmark-outline" size={64} color={colors.secondary} />
          <AppText className="text-xl font-bold mt-4 mb-2" style={{ color: colors.text }}>
            No Mantras Yet
          </AppText>
          <AppText
            className="text-base text-center leading-5 pt-2"
            style={{ color: colors.text, opacity: 0.7 }}
          >
            Save mantras to this collection to see them here
          </AppText>
        </View>
      ) : (
        <FlatList
          testID="mantra-list"
          data={mantras}
          keyExtractor={(item) => item.mantra_id.toString()}
          renderItem={renderItem}
          numColumns={NUM_COLUMNS}
          columnWrapperStyle={{ justifyContent: 'space-between', marginBottom: ITEM_MARGIN }}
          contentContainerStyle={{ padding: ITEM_MARGIN }}
          refreshing={refreshing}
          onRefresh={handleRefresh}
        />
      )}
    </View>
  );
}
