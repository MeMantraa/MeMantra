import React, { useState, useRef } from 'react';
import { View, Text, Dimensions, FlatList, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

// Mock data for the feed
const MOCK_FEED_DATA = [
  {
    id: '1',
    title: 'Amazing Content 1',
    description: 'This is a sample post description',
    likes: 1234,
    isLiked: false,
  },
  {
    id: '2',
    title: 'Cool Video 2',
    description: 'Another interesting post',
    likes: 5678,
    isLiked: false,
  },
  {
    id: '3',
    title: 'Awesome Post 3',
    description: 'Check this out!',
    likes: 9012,
    isLiked: false,
  },
  {
    id: '4',
    title: 'Great Content 4',
    description: 'You will love this',
    likes: 3456,
    isLiked: false,
  },
  {
    id: '5',
    title: 'Fantastic Video 5',
    description: 'Must see content',
    likes: 7890,
    isLiked: false,
  },
];

export default function HomeScreen() {
  const [feedData, setFeedData] = useState(MOCK_FEED_DATA);
  const flatListRef = useRef<FlatList>(null);

  const handleLike = (itemId: string) => {
    setFeedData((prevData) =>
      prevData.map((item) => {
        if (item.id === itemId) {
          return {
            ...item,
            isLiked: !item.isLiked,
            likes: item.isLiked ? item.likes - 1 : item.likes + 1,
          };
        }
        return item;
      }),
    );
  };

  const renderItem = ({ item }: { item: (typeof MOCK_FEED_DATA)[0] }) => {
    return (
      <View
        style={{ height: SCREEN_HEIGHT, width: SCREEN_WIDTH }}
        className="justify-center items-center relative"
      >
        {/* Content Card */}
        <View
          style={{ width: SCREEN_WIDTH * 0.85 }}
          className="p-6 bg-white/15 rounded-[20px] items-center justify-center"
        >
          <Text className="text-[28px] font-bold text-white mb-3 text-center">{item.title}</Text>
          <Text className="text-base text-white/90 text-center">{item.description}</Text>
        </View>

        {/* Like Button - Positioned on the right side */}
        <View className="absolute right-4 bottom-[100px] items-center">
          <TouchableOpacity
            className="items-center justify-center my-3 bg-black/30 rounded-[50px] p-3"
            onPress={() => handleLike(item.id)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={item.isLiked ? 'heart' : 'heart-outline'}
              size={40}
              color={item.isLiked ? '#ff4444' : 'white'}
            />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-[#9AA793]">
      <FlatList
        ref={flatListRef}
        data={feedData}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToAlignment="start"
        decelerationRate="fast"
        snapToInterval={SCREEN_HEIGHT}
        getItemLayout={(data, index) => ({
          length: SCREEN_HEIGHT,
          offset: SCREEN_HEIGHT * index,
          index,
        })}
      />
    </View>
  );
}
