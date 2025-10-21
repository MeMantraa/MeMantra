import React, { useState, useRef } from 'react';
import { View, Dimensions, FlatList, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MantraCarousel from '../components/carousel';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const MOCK_FEED_DATA = [
  {
    id: '1',
    mantra: 'Pressure Is a Privilege',
    keyTakeaway:
      'When you\'re spiralling or feeling tense, say it to yourself "Pressure is a privilege" and then smile to remind yourself to enjoy the fact that you got the opportunity.',
    isLiked: false,
    isSaved: false,
  },
  {
    id: '2',
    mantra: 'The Only Way Out Is Through',
    keyTakeaway:
      'When facing difficult situations, remind yourself that avoiding the challenge only prolongs the pain. Embrace the difficulty and move forward through it.',
    isLiked: false,
    isSaved: false,
  },
  {
    id: '3',
    mantra: 'What We Think, We Become',
    keyTakeaway:
      'Your thoughts shape your reality. When negative thoughts arise, acknowledge them and consciously redirect to positive, empowering thoughts.',
    isLiked: false,
    isSaved: false,
  },
  {
    id: '4',
    mantra: 'Embrace the Journey',
    keyTakeaway:
      'Focus on the process rather than the outcome. Each step forward is progress, even if the destination seems far away.',
    isLiked: false,
    isSaved: false,
  },
  {
    id: '5',
    mantra: 'Be Here Now',
    keyTakeaway:
      'When anxiety about the future or regret about the past overwhelms you, bring your attention to the present moment. What can you see, hear, and feel right now?',
    isLiked: false,
    isSaved: false,
  },
];

export default function HomeScreen() {
  const [feedData, setFeedData] = useState(MOCK_FEED_DATA);
  const verticalListRef = useRef<FlatList>(null);

  const handleLike = (itemId: string) => {
    setFeedData((prevData) =>
      prevData.map((item) => {
        if (item.id === itemId) {
          return {
            ...item,
            isLiked: !item.isLiked,
          };
        }
        return item;
      }),
    );
  };

  const handleSave = (itemId: string) => {
    setFeedData((prevData) =>
      prevData.map((item) => {
        if (item.id === itemId) {
          return {
            ...item,
            isSaved: !item.isSaved,
          };
        }
        return item;
      }),
    );
  };

  return (
    <View className="flex-1 bg-[#9AA793]">
      {/* Header with icons */}
      <View className="absolute top-5 left-0 right-0 z-10 flex-row justify-between items-center px-6 pt-14 pb-4">
        {/* Search icon */}
        <TouchableOpacity className="w-12 h-12 rounded-full bg-[#E6D29C] items-center justify-center">
          <Ionicons name="search-outline" size={24} color="#6D7E68" />
        </TouchableOpacity>

        {/* Profile icon */}
        <TouchableOpacity className="w-12 h-12 rounded-full bg-[#E6D29C] items-center justify-center">
          <Ionicons name="person-outline" size={24} color="#6D7E68" />
        </TouchableOpacity>
      </View>

      {/* Vertical FlatList for different mantras */}
      <FlatList
        ref={verticalListRef}
        data={feedData}
        renderItem={({ item }) => (
          <MantraCarousel item={item} onLike={handleLike} onSave={handleSave} />
        )}
        keyExtractor={(item) => item.id}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToAlignment="start"
        decelerationRate="fast"
        snapToInterval={SCREEN_HEIGHT}
        viewabilityConfig={{
          itemVisiblePercentThreshold: 50,
        }}
        getItemLayout={(data, index) => ({
          length: SCREEN_HEIGHT,
          offset: SCREEN_HEIGHT * index,
          index,
        })}
      />
    </View>
  );
}
