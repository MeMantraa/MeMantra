import React, { useEffect, useRef, useState } from 'react';
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

interface MantraWithState extends Mantra {
  isLiked: boolean;
  isSaved: boolean;
}

export default function HomeScreen() {
  const [feedData, setFeedData] = useState<MantraWithState[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const verticalListRef = useRef<FlatList>(null);

  useEffect(() => {
    fetchMantras();
  }, []);

  const fetchMantras = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = (await storage.getToken()) || 'mock-token';
      const response = await mantraService.getFeedMantras(token);

      if (response.status === 'success' && response.data) {
        const formatted = response.data.map((m) => ({
          ...m,
          isLiked: m.isLiked ?? false,
          isSaved: m.isSaved ?? false,
        }));
        setFeedData(formatted);
      } else {
        setError('Failed to load mantras.');
      }
    } catch (err) {
      console.error('Error fetching mantras:', err);
      Alert.alert('Error', 'Could not load mantras.');
      setError('Error loading mantras.');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = (id: number) => {
    setFeedData((prev) =>
      prev.map((item) => (item.mantra_id === id ? { ...item, isLiked: !item.isLiked } : item)),
    );
  };

  const handleSave = (id: number) => {
    setFeedData((prev) =>
      prev.map((item) => (item.mantra_id === id ? { ...item, isSaved: !item.isSaved } : item)),
    );
  };

  if (loading) {
    return (
      <View className="flex-1 bg-[#9AA793] justify-center items-center">
        <ActivityIndicator size="large" color="#E6D29C" />
        <Text className="text-white mt-4 text-base">Loading mantras...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 bg-[#9AA793] justify-center items-center px-6">
        <Ionicons name="alert-circle-outline" size={64} color="#E6D29C" />
        <Text className="text-white mt-4 text-lg text-center font-semibold">{error}</Text>
        <TouchableOpacity
          className="bg-[#E6D29C] rounded-full px-6 py-3 mt-6"
          onPress={fetchMantras}
        >
          <Text className="text-[#6D7E68] font-semibold text-base">Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#9AA793]">
      {/* Header with icons */}
      <View className="absolute top-5 left-0 right-0 z-10 flex-row justify-between items-center px-6 pt-14 pb-4">
        {/* Search */}
        <TouchableOpacity className="w-12 h-12 rounded-full bg-[#E6D29C] items-center justify-center">
          <Ionicons name="search-outline" size={24} color="#6D7E68" />
        </TouchableOpacity>

        {/* Profile */}
        <TouchableOpacity className="w-12 h-12 rounded-full bg-[#E6D29C] items-center justify-center">
          <Ionicons name="person-outline" size={24} color="#6D7E68" />
        </TouchableOpacity>
      </View>

      {/* Vertical swipe feed */}
      <FlatList
        ref={verticalListRef}
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
        viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
      />
    </View>
  );
}
