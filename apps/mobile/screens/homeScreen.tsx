import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  FlatList,
  Dimensions,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Text,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MantraCarousel from '../components/carousel';
import { mantraService, Mantra } from '../services/mantra.service';
import { collectionService, Collection } from '../services/collection.service';
import { ratingService } from '../services/rating.service';
import { storage } from '../utils/storage';
import AppText from '../components/UI/textWrapper';
import { useTheme } from '../context/ThemeContext';
import { useSavedMantras } from '../context/SavedContext';
import SavedPopupBar from '../components/UI/savedPopupBar';
import CollectionsSheet from '../components/collectionsSheet';
import { useReminders } from '../hooks/useReminders';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function HomeScreen({ navigation, route }: any) {
  const [feedData, setFeedData] = useState<Mantra[]>([]);
  const [originalMantras, setOriginalMantras] = useState<Mantra[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSavedPopup, setShowSavedPopup] = useState(false);
  const [showCollectionsSheet, setShowCollectionsSheet] = useState(false);
  const [collectionToast, setCollectionToast] = useState('');
  const [collections, setCollections] = useState<Collection[]>([]);
  const [currentMantraId, setCurrentMantraId] = useState<number | null>(null);

  //for smoother animations
  const [initialIndex, setInitialIndex] = useState(0);
  const [readyToShowFeed, setReadyToShowFeed] = useState(false);

  const { colors } = useTheme();
  const { remindersByMantra, handleReminderPress } = useReminders();

  const listRef = useRef<FlatList<Mantra>>(null);
  const { setSavedMantras } = useSavedMantras();

  useEffect(() => {
    loadMantras();
    loadCollections();
  }, []);

  const loadMantras = async () => {
    try {
      setLoading(true);
      setReadyToShowFeed(false);
      const token = (await storage.getToken()) || 'mock-token';
      const response = await mantraService.getFeedMantras(token);

      if (response.status === 'success') {
        setOriginalMantras(response.data);
        setFeedData(response.data);
      } else {
        setOriginalMantras([]);
        setFeedData([]);
      }
    } catch (err) {
      console.error('Error fetching mantras:', err);
      setOriginalMantras([]);
      setFeedData([]);
    } finally {
      setLoading(false);
    }
  };

  // compute index of mantra to show (in case user accesses a mantra from the messaging tab)
  useEffect(() => {
    if (loading) return;
    if (!feedData.length) return;

    const raw = route?.params?.returnToMantraId;
    const targetId = raw !== undefined && raw !== null ? Number(raw) : undefined;

    // normal home behavior
    if (!targetId || Number.isNaN(targetId)) {
      setInitialIndex(0);
      setReadyToShowFeed(true);
      return;
    }

    const idx = feedData.findIndex((m) => m.mantra_id === targetId);

    // if not found, just show normally
    if (idx < 0) {
      setInitialIndex(0);
      setReadyToShowFeed(true);
      navigation.setParams({ returnToMantraId: undefined });
      return;
    }

    setInitialIndex(idx);
    setReadyToShowFeed(true);

    //if the list is already on screen (coming from Messages), jump immediately
    requestAnimationFrame(() => {
      listRef.current?.scrollToIndex({ index: idx, animated: false });
    });

    // clear param so it doesn't keep jumping
    navigation.setParams({ returnToMantraId: undefined });
  }, [loading, feedData, route?.params?.returnToMantraId, navigation]);

  const loadCollections = async () => {
    try {
      const token = (await storage.getToken()) || 'mock-token';
      const response = await collectionService.getUserCollections(token);

      if (response.status === 'success' && response.data) {
        setCollections(response.data.collections);
      }
    } catch (err) {
      console.error('Error fetching collections:', err);
    }
  };

  const handleLike = async (mantraId: number) => {
    try {
      const token = (await storage.getToken()) || 'mock-token';
      const mantra = feedData.find((m) => m.mantra_id === mantraId);
      const isCurrentlyLiked = mantra?.isLiked || false;

      setFeedData((prev) =>
        prev.map((m) =>
          m.mantra_id === mantraId
            ? {
                ...m,
                isLiked: !m.isLiked,
                like_count: (m.like_count || 0) + (isCurrentlyLiked ? -1 : 1),
              }
            : m,
        ),
      );

      if (isCurrentlyLiked) {
        await mantraService.unlikeMantra(mantraId, token);
      } else {
        await mantraService.likeMantra(mantraId, token);
      }
    } catch (err) {
      console.error('Error toggling like:', err);
      setFeedData((prev) =>
        prev.map((m) =>
          m.mantra_id === mantraId
            ? {
                ...m,
                isLiked: !m.isLiked,
                like_count: (m.like_count || 0) + (m.isLiked ? -1 : 1),
              }
            : m,
        ),
      );
      Alert.alert('Error', 'Failed to update like status');
    }
  };

  const handleSave = async (mantraId: number) => {
    try {
      const token = (await storage.getToken()) || 'mock-token';
      const isCurrentlySaved = feedData.find((m) => m.mantra_id === mantraId)?.isSaved || false;

      setFeedData((prev) =>
        prev.map((m) => (m.mantra_id === mantraId ? { ...m, isSaved: !m.isSaved } : m)),
      );

      if (isCurrentlySaved) {
        await mantraService.unsaveMantra(mantraId, token);
        setSavedMantras((prev) => prev.filter((m) => m.mantra_id !== mantraId));
      } else {
        await mantraService.saveMantra(mantraId, token);
        const savedMantra = feedData.find((m) => m.mantra_id === mantraId);
        if (savedMantra) setSavedMantras((prev) => [...prev, savedMantra]);

        setCurrentMantraId(mantraId);
        setShowSavedPopup(true);
      }
    } catch (err) {
      console.error('Error toggling save:', err);
      setFeedData((prev) =>
        prev.map((m) => (m.mantra_id === mantraId ? { ...m, isSaved: !m.isSaved } : m)),
      );
      Alert.alert('Error', 'Failed to update save status');
    }
  };

  const handleShare = (mantraId: number) => {
    const mantra = feedData.find((m) => m.mantra_id === mantraId);
    if (!mantra) return;

    navigation.navigate('ShareMantra', { mantra });
  };

  const handleJournal = (mantraId: number, mantraTitle: string) => {
    navigation.navigate('JournalEditor', { mantraId, mantraTitle });
  };

  const handleReminder = (mantraId: number) => {
    handleReminderPress('mantra', mantraId, navigation);
  };

  const handleSelectCollection = async (collectionId: number) => {
    if (!currentMantraId) {
      Alert.alert('Error', 'No mantra selected');
      return;
    }

    try {
      const token = (await storage.getToken()) || 'mock-token';
      const response = await collectionService.addMantraToCollection(
        collectionId,
        currentMantraId,
        token,
      );

      if (response.status === 'success') {
        const collection = collections.find((c) => c.collection_id === collectionId);
        setCollectionToast(collection?.name || 'collection');
        setTimeout(() => setCollectionToast(''), 2000);
      } else {
        Alert.alert('Error', response.message || 'Failed to add to collection');
      }
    } catch (err) {
      console.error('Error adding to collection:', err);
      Alert.alert('Error', 'Failed to add mantra to collection');
    }
  };

  const handleCreateCollection = async (name: string): Promise<number> => {
    try {
      const token = (await storage.getToken()) || 'mock-token';
      const response = await collectionService.createCollection(name, undefined, token);

      if (response.status === 'success' && response.data) {
        const newCollection = response.data.collection;
        setCollections((prev) => [newCollection, ...prev]);
        return newCollection.collection_id;
      } else {
        Alert.alert('Error', response.message || 'Failed to create collection');
        throw new Error('Failed to create collection');
      }
    } catch (err) {
      console.error('Error creating collection:', err);
      Alert.alert('Error', 'Failed to create collection');
      throw err;
    }
  };

  const handleRate = async (mantraId: number, rating: number) => {
    try {
      const token = (await storage.getToken()) || 'mock-token';
      const response = await ratingService.rateMantra(mantraId, rating, undefined, token);

      if (response.status !== 'success') {
        Alert.alert('Error', response.message || 'Failed to save rating');
      }
    } catch (err) {
      console.error('Error rating mantra:', err);
      Alert.alert('Error', 'Failed to save rating');
    }
  };

  const handleEndReached = () => {
    if (originalMantras.length > 0) {
      setFeedData((prev) => [...prev, ...originalMantras]);
    }
  };

  let content;

  if (loading || (!readyToShowFeed && feedData.length > 0)) {
    content = (
      <View
        className="flex-1 justify-center items-center"
        style={{ backgroundColor: colors.primary }}
      >
        <ActivityIndicator size="large" color={colors.secondary} />
        <AppText className="mt-4 text-base" style={{ color: colors.text }}>
          Loading mantras...
        </AppText>
      </View>
    );
  } else if (feedData.length === 0) {
    content = (
      <View
        className="flex-1 justify-center items-center px-6"
        style={{ backgroundColor: colors.primary }}
      >
        <Ionicons name="book-outline" size={64} color={colors.secondary} />
        <AppText className="mt-4 text-lg font-semibold text-center" style={{ color: colors.text }}>
          No mantras available
        </AppText>
        <TouchableOpacity
          className="rounded-full px-6 py-3 mt-6"
          onPress={loadMantras}
          accessibilityRole="button"
          style={{ backgroundColor: colors.secondary }}
        >
          <AppText className="font-semibold text-base" style={{ color: colors.primary }}>
            Refresh
          </AppText>
        </TouchableOpacity>
      </View>
    );
  } else {
    content = (
      <FlatList
        key={`feed-${initialIndex}`} // ✅ remount so initialScrollIndex is applied when it changes
        ref={listRef}
        data={feedData}
        initialScrollIndex={initialIndex} // ✅ no flash to first item
        renderItem={({ item }) => (
          <MantraCarousel
            item={item}
            onLike={handleLike}
            onSave={handleSave}
            onShare={handleShare}
            onJournal={handleJournal}
            onReminder={handleReminder}
            hasReminder={remindersByMantra.has(item.mantra_id)}
            onPress={() =>
              navigation.navigate('Focus', {
                mantra: item,
                onLike: handleLike,
                onSave: handleSave,
              })
            }
          />
        )}
        keyExtractor={(item, index) => `${item.mantra_id}-${index}`}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToAlignment="start"
        decelerationRate="fast"
        snapToInterval={SCREEN_HEIGHT}
        onEndReached={handleEndReached}
        onEndReachedThreshold={2.0}
        getItemLayout={(_, index) => ({
          length: SCREEN_HEIGHT,
          offset: SCREEN_HEIGHT * index,
          index,
        })}
        onScrollToIndexFailed={(info) => {
          setTimeout(() => {
            listRef.current?.scrollToIndex({ index: info.index, animated: false });
          }, 50);
        }}
      />
    );
  }

  return (
    <View className="flex-1" style={{ backgroundColor: colors.primary }}>
      <TouchableOpacity
        className="absolute z-20 rounded-full items-center justify-center"
        style={{
          top: 68,
          left: 24,
          width: 42,
          height: 42,
          backgroundColor: colors.secondary,
        }}
        testID="home-search-button"
        accessibilityRole="button"
      >
        <Ionicons name="search-outline" size={24} color={colors.white} />
      </TouchableOpacity>

      {content}

      <SavedPopupBar
        visible={showSavedPopup}
        onHide={() => setShowSavedPopup(false)}
        onPressCollections={() => {
          setShowSavedPopup(false);
          setShowCollectionsSheet(true);
        }}
        onRate={(rating) => {
          if (currentMantraId) {
            handleRate(currentMantraId, rating);
          }
        }}
      />
      <CollectionsSheet
        visible={showCollectionsSheet}
        collections={collections}
        onClose={() => {
          setShowCollectionsSheet(false);
          setCurrentMantraId(null);
        }}
        onSelectCollection={handleSelectCollection}
        onCreateCollection={handleCreateCollection}
        onRefresh={loadCollections}
      />

      {!!collectionToast && (
        <View
          className="absolute top-24 self-center rounded-full px-6 py-3 shadow-lg"
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.6)' }}
        >
          <Text className="text-base" style={{ color: '#111827' }}>
            Added to {collectionToast}
          </Text>
        </View>
      )}
    </View>
  );
}
