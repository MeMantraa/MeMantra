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
import SearchBar from '../components/UI/searchBar';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function HomeScreen({ navigation }: any) {
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

  const handleLogout = async () => {
    try {
      if (typeof storage.removeToken === 'function') {
        await storage.removeToken();
      } else if (typeof storage.saveToken === 'function') {
        await storage.saveToken('');
      }

      if (typeof storage.removeUserData === 'function') {
        await storage.removeUserData();
      } else if (typeof storage.saveUserData === 'function') {
        await storage.saveUserData(null);
      }

      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } catch (err) {
      console.error('Logout error:', err);
      Alert.alert('Error', 'Failed to log out. Please try again.');
    }
  };

  //TODO: Implement search functionality
  const handleSearch = (query: string) => {
    console.log('Searching for:', query);
    // TODO: Implement your search logic
  };

  const handleUserPress = () => {
    Alert.alert(
      'Account',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Log out', style: 'destructive', onPress: () => void handleLogout() },
      ],
      { cancelable: true },
    );
  };

  // Determine what to render based on loading state and feed data (SonarQube)
  let content;

  if (loading) {
    content = (
      <View className="flex-1 bg-[#9AA793] justify-center items-center">
        <ActivityIndicator size="large" color="#E6D29C" />
        <Text className="text-white mt-4 text-base">Loading mantras...</Text>
      </View>
    );
  } else if (feedData.length === 0) {
    content = (
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
  } else {
    content = (
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
    );
  }

  return (
    <View className="flex-1 bg-[#9AA793]">
      {/* Header is rendered for all states (loading / empty / feed) */}
      <View className="absolute top-5 left-0 right-0 z-10 flex-row justify-between items-center px-6 pt-14 pb-4">
        <SearchBar onSearch={handleSearch} placeholder="Search mantras..." />
        <TouchableOpacity
          accessibilityRole="button"
          className="w-12 h-12 rounded-full bg-[#E6D29C] items-center justify-center"
          onPress={handleUserPress}
        >
          <Ionicons name="person-outline" size={24} color="#6D7E68" />
        </TouchableOpacity>
      </View>

      {/* Main content */}
      {content}
    </View>
  );
}
