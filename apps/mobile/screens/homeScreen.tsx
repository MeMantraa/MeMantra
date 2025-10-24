import React, { useEffect, useState } from 'react';
import {
  View,
  FlatList,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Text,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MantraCarousel from '../components/carousel';
import { mantraService, Mantra } from '../services/mantra.service';
import { storage } from '../utils/storage';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function HomeScreen() {
  const [feedData, setFeedData] = useState<Mantra[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMantras();
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

  const handleLike = async (mantraId: number) => {
    try {
      const token = (await storage.getToken()) || 'mock-token';
      const isCurrentlyLiked = feedData.find((m) => m.mantra_id === mantraId)?.isLiked || false;

      setFeedData((prev) =>
        prev.map((m) => (m.mantra_id === mantraId ? { ...m, isLiked: !m.isLiked } : m)),
      );

      if (isCurrentlyLiked) {
        await mantraService.unlikeMantra(mantraId, token);
      } else {
        await mantraService.likeMantra(mantraId, token);
      }
    } catch (err) {
      console.error('Error toggling like:', err);
      setFeedData((prev) =>
        prev.map((m) => (m.mantra_id === mantraId ? { ...m, isLiked: !m.isLiked } : m)),
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
      } else {
        await mantraService.saveMantra(mantraId, token);
      }
    } catch (err) {
      console.error('Error toggling save:', err);
      setFeedData((prev) =>
        prev.map((m) => (m.mantra_id === mantraId ? { ...m, isSaved: !m.isSaved } : m)),
      );
      Alert.alert('Error', 'Failed to update save status');
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-[#9AA793] justify-center items-center">
        <ActivityIndicator size="large" color="#E6D29C" />
        <Text className="text-white mt-4 text-base">Loading mantras...</Text>
      </View>
    );
  }

  if (feedData.length === 0) {
    return (
      <View className="flex-1 bg-[#9AA793] justify-center items-center px-6">
        <Ionicons name="book-outline" size={64} color="#E6D29C" />
        <Text className="text-white mt-4 text-lg font-semibold text-center">
          No mantras available
        </Text>
        <TouchableOpacity
          className="bg-[#E6D29C] rounded-full px-6 py-3 mt-6"
          onPress={loadMantras}
        >
          <Text className="text-[#6D7E68] font-semibold text-base">Refresh</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#9AA793]">
      <View className="absolute top-5 left-0 right-0 z-10 flex-row justify-between items-center px-6 pt-14 pb-4">
        <TouchableOpacity className="w-12 h-12 rounded-full bg-[#E6D29C] items-center justify-center">
          <Ionicons name="search-outline" size={24} color="#6D7E68" />
        </TouchableOpacity>
        <TouchableOpacity className="w-12 h-12 rounded-full bg-[#E6D29C] items-center justify-center">
          <Ionicons name="person-outline" size={24} color="#6D7E68" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={feedData}
        renderItem={({ item }) => (
          <MantraCarousel item={item} onLike={handleLike} onSave={handleSave} />
        )}
        keyExtractor={(item) => item.mantra_id.toString()}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToAlignment="start"
        decelerationRate="fast"
        snapToInterval={SCREEN_HEIGHT}
      />
    </View>
  );
}
