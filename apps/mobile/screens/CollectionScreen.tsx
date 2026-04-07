import React, { useCallback, useMemo } from 'react';
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
import { Collection } from '../services/collection.service';
import { useReminders } from '../hooks/useReminders';
import { useFocusEffect } from '@react-navigation/native';
import { useUserCollections, useDeleteCollection } from '../hooks';

const SCREEN_WIDTH = Dimensions.get('window').width;
const ITEM_MARGIN = 12;
const NUM_COLUMNS = 2;
const ITEM_SIZE = (SCREEN_WIDTH - ITEM_MARGIN * (NUM_COLUMNS + 1)) / NUM_COLUMNS;

export default function CollectionsScreen({ navigation }: any) {
  const { colors } = useTheme();
  const { data, isLoading, isRefetching, refetch } = useUserCollections();
  const deleteCollection = useDeleteCollection();
  const { remindersByCollection, handleReminderPress } = useReminders();

  const collections = useMemo(() => {
    const raw = data?.data?.collections ?? [];
    return [...raw].sort((a, b) => {
      if (a.name === 'Saved Mantras') return -1;
      if (b.name === 'Saved Mantras') return 1;
      return 0;
    });
  }, [data]);

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

  const handleCollectionReminder = (collection: Collection) => {
    handleReminderPress('collection', collection.collection_id, navigation);
  };

  const handleCollectionPress = (collection: Collection) => {
    navigation.navigate('CollectionDetail', {
      collectionId: collection.collection_id,
      collectionName: collection.name,
    });
  };

  const handleDeleteCollection = (collection: Collection) => {
    Alert.alert(
      'Delete Collection',
      `Are you sure you want to delete "${collection.name}"? This action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteCollection.mutate(collection.collection_id, {
              onSuccess: () => Alert.alert('Success', 'Collection deleted successfully'),
              onError: () => Alert.alert('Error', 'Failed to delete collection'),
            });
          },
        },
      ],
    );
  };

  const renderItem = ({ item }: { item: Collection }) => (
    <View
      style={{
        width: ITEM_SIZE,
        marginBottom: ITEM_MARGIN,
      }}
    >
      <TouchableOpacity
        className="justify-center items-center rounded-xl p-4"
        style={{
          width: ITEM_SIZE,
          height: ITEM_SIZE,
          backgroundColor: colors.primaryDark,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 5,
          elevation: 4,
        }}
        onPress={() => handleCollectionPress(item)}
      >
        <Ionicons
          name={(item.icon || 'folder') as any}
          size={40}
          color={colors.secondary}
          className="mb-2"
        />
        <AppText
          className="text-base font-bold text-center mb-1"
          style={{ color: colors.text }}
          numberOfLines={2}
        >
          {item.name}
        </AppText>
        {item.description && (
          <AppText
            className="text-xs text-center"
            style={{ color: colors.text, opacity: 0.7 }}
            numberOfLines={2}
          >
            {item.description}
          </AppText>
        )}
      </TouchableOpacity>

      {/* Reminder button */}
      <TouchableOpacity
        testID={`collection-reminder-${item.collection_id}`}
        className="absolute bottom-2 right-2 p-1"
        onPress={() => handleCollectionReminder(item)}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons
          name={
            remindersByCollection.has(item.collection_id)
              ? 'notifications'
              : 'notifications-outline'
          }
          size={20}
          color={remindersByCollection.has(item.collection_id) ? colors.secondary : colors.text}
        />
      </TouchableOpacity>

      {/* Delete button - only show if not "Saved Mantras" */}
      {item.name !== 'Saved Mantras' && (
        <TouchableOpacity
          className="absolute top-2 right-2 p-1"
          onPress={() => handleDeleteCollection(item)}
        >
          <Ionicons name="remove" size={24} color="white" />
        </TouchableOpacity>
      )}
    </View>
  );

  if (isLoading) {
    return (
      <View className="flex-1" style={{ backgroundColor: colors.primary }}>
        <View className="pt-[60px] pb-4 px-[30px]" style={{ backgroundColor: colors.primary }}>
          <AppText className="text-[30px] font-bold" style={{ color: colors.text }}>
            Collections
          </AppText>
        </View>
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={colors.secondary} />
          <AppText className="mt-3 text-base" style={{ color: colors.text }}>
            Loading collections...
          </AppText>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1" style={{ backgroundColor: colors.primary }}>
      <View className="pt-[60px] pb-4 px-[30px]" style={{ backgroundColor: colors.primary }}>
        <AppText className="text-[30px] font-bold" style={{ color: colors.text }}>
          Collections
        </AppText>
      </View>

      {collections.length === 0 ? (
        <View className="flex-1 justify-center items-center px-10">
          <Ionicons name="folder-open-outline" size={64} color={colors.secondary} />
          <AppText className="text-xl font-bold mt-4 mb-2" style={{ color: colors.text }}>
            No Collections Yet
          </AppText>
          <AppText
            className="text-sm text-center leading-5"
            style={{ color: colors.text, opacity: 0.7 }}
          >
            Save mantras to collections to organize your library
          </AppText>
        </View>
      ) : (
        <FlatList
          data={collections}
          keyExtractor={(item) => item.collection_id.toString()}
          renderItem={renderItem}
          numColumns={NUM_COLUMNS}
          columnWrapperStyle={{
            justifyContent: 'space-between',
            paddingHorizontal: ITEM_MARGIN,
          }}
          contentContainerStyle={{ paddingTop: ITEM_MARGIN }}
          refreshing={isRefetching}
          onRefresh={refetch}
        />
      )}
    </View>
  );
}
