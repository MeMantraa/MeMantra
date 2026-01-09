import React, { useEffect, useState } from 'react';
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
import { storage } from '../utils/storage';
import SearchBar from '../components/UI/searchBar';
import IconButton from '../components/UI/iconButton';
import { logoutUser } from '../utils/auth';
import AppText from '../components/UI/textWrapper';
import { useTheme } from '../context/ThemeContext';
import { useSavedMantras } from '../context/SavedContext';
import SavedPopupBar from '../components/UI/savedPopupBar';
import CollectionsSheet from '../components/collectionsSheet';
import { likeService } from '../services/like.service';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

type MantraWithInteractions = Mantra & {
  isLiked?: boolean;
  isSaved?: boolean;
  like_count?: number;
};

export default function HomeScreen({ navigation }: any) {
  const [feedData, setFeedData] = useState<Mantra[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSavedPopup, setShowSavedPopup] = useState(false);
  const [showCollectionsSheet, setShowCollectionsSheet] = useState(false);
  const [collectionToast, setCollectionToast] = useState('');
  const [collections, setCollections] = useState<Collection[]>([]);
  const [currentMantraId, setCurrentMantraId] = useState<number | null>(null);

  const { colors } = useTheme();
  const { setSavedMantras } = useSavedMantras();

  useEffect(() => {
    loadMantras();
    loadCollections();
  }, []);

  const loadMantras = async () => {
    try {
      const token = (await storage.getToken()) || 'mock-token';
      const response = await mantraService.getFeedMantras(token);

      if (response.status === 'success') {
        setFeedData(response.data);
      }
    } catch (err) {
      console.error('Error fetching mantras:', err);
    } finally {
      setLoading(false);
    }
  };

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
      
      const targetMantra = feedData.find((m) => m.mantra_id === mantraId);
      if (!targetMantra) return;
      
      const isCurrentlyLiked = targetMantra.isLiked;

      setFeedData((prev) =>
        prev.map((m) => {
          if (m.mantra_id === mantraId) {
            return { 
              ...m, 
              isLiked: !m.isLiked,
              like_count: isCurrentlyLiked ? m.like_count - 1 : m.like_count + 1
            };
          }
          return m;
        })
      );

      if (isCurrentlyLiked) {
        await mantraService.unlikeMantra(mantraId, token);
      } else {
        await mantraService.likeMantra(mantraId, token);
      }
    } catch (err) {
      console.error('Error toggling like:', err);
      
      setFeedData((prev) =>
        prev.map((m) => {
          if (m.mantra_id === mantraId) {
            const originalIsLiked = !m.isLiked; 
            return { 
              ...m, 
              isLiked: originalIsLiked,
              like_count: originalIsLiked ? m.like_count + 1 : m.like_count - 1 
            };
          }
          return m;
        })
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

        // Store the mantra ID and show popup + collections sheet
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

  const handleLogout = () => logoutUser(navigation);

  const handleSearch = (query: string) => console.log('Searching for:', query);

  const handleUserPress = () => {
    Alert.alert(
      'Account',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log out',
          style: 'destructive',
          onPress: () => {
            void handleLogout();
          },
        },
      ],
      { cancelable: true },
    );
  };

  let content;

  if (loading) {
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
        data={feedData}
        renderItem={({ item }) => (
          <MantraCarousel
            item={item}
            onLike={handleLike}
            onSave={handleSave}
            onPress={() =>
              navigation.navigate('Focus', {
                mantra: item,
                onLike: handleLike,
                onSave: handleSave,
              })
            }
          />
        )}
        keyExtractor={(item) => item.mantra_id.toString()}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToAlignment="start"
        decelerationRate="fast"
        snapToInterval={SCREEN_HEIGHT}
      />
    );
  }

  return (
    <View className="flex-1" style={{ backgroundColor: colors.primary }}>
      <View className="absolute top-5 left-0 right-0 z-10 flex-row justify-between items-center px-6 pt-14 pb-4">
        <SearchBar onSearch={handleSearch} placeholder="Search mantras..." />
        <IconButton type="profile" onPress={handleUserPress} testID="profile-btn" />
      </View>

      {/* Main feed */}
      {content}

      <SavedPopupBar
        visible={showSavedPopup}
        onHide={() => setShowSavedPopup(false)}
        onPressCollections={() => {
          setShowSavedPopup(false);
          setShowCollectionsSheet(true);
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
