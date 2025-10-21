import React, { useState, useRef } from 'react';
import { View, Text, Dimensions, FlatList, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

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
  const [currentVerticalIndex, setCurrentVerticalIndex] = useState(0);
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

  const onVerticalViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentVerticalIndex(viewableItems[0].index || 0);
    }
  }).current;

  const MantraCard = ({ item }: { item: (typeof MOCK_FEED_DATA)[0] }) => {
    const [currentHorizontalIndex, setCurrentHorizontalIndex] = useState(0);
    const horizontalPages = [
      {
        type: 'mantra',
        content: item.mantra,
      },
      {
        type: 'takeaway',
        content: item.keyTakeaway,
      },
    ];

    const onHorizontalViewableItemsChanged = useRef(({ viewableItems }: any) => {
      if (viewableItems.length > 0) {
        setCurrentHorizontalIndex(viewableItems[0].index || 0);
      }
    }).current;

    return (
      <View
        style={{ height: SCREEN_HEIGHT }}
        className="justify-center items-center relative bg-[#9AA793] px-6"
      >
        {/* Quote marks */}
        <View className="absolute top-32 z-10">
          <Text className="text-white text-5xl opacity-50">" "</Text>
        </View>

        {/* Horizontal Carousel */}
        <FlatList
          data={horizontalPages}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          snapToAlignment="center"
          decelerationRate="fast"
          onViewableItemsChanged={onHorizontalViewableItemsChanged}
          viewabilityConfig={{
            itemVisiblePercentThreshold: 50,
          }}
          keyExtractor={(page, index) => `${item.id}-${index}`}
          renderItem={({ item: page }) => (
            <View style={{ width: SCREEN_WIDTH - 48 }} className="items-center justify-center">
              <View className="w-full rounded-3xl bg-[#9AA793] p-8 items-center justify-center min-h-[400px]">
                {page.type === 'mantra' ? (
                  <>
                    {/* Mantra text */}
                    <View className="items-center justify-center flex-1">
                      <Text className="text-white text-3xl font-light text-center leading-[45px] tracking-wide">
                        {page.content}
                      </Text>
                    </View>
                  </>
                ) : (
                  <>
                    {/* Key Takeaway header */}
                    <View className="mb-6">
                      <Text className="text-[#E6D29C] text-xl font-semibold">Key Takeaway</Text>
                    </View>

                    {/* Takeaway text */}
                    <View className="items-center justify-center flex-1">
                      <Text className="text-white text-lg text-center leading-[30px]">
                        {page.content}
                      </Text>
                    </View>
                  </>
                )}
              </View>
            </View>
          )}
        />

        {/* Right side action buttons */}
        <View className="absolute right-6 bottom-32 items-center space-y-6">
          {/* Save/Bookmark button */}
          <TouchableOpacity
            className="items-center justify-center"
            onPress={() => handleSave(item.id)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={item.isSaved ? 'bookmark' : 'bookmark-outline'}
              size={32}
              color="white"
            />
          </TouchableOpacity>

          {/* Like button */}
          <TouchableOpacity
            className="items-center justify-center mt-6"
            onPress={() => handleLike(item.id)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={item.isLiked ? 'heart' : 'heart-outline'}
              size={36}
              color={item.isLiked ? '#ff4444' : 'white'}
            />
          </TouchableOpacity>
        </View>

        {/* Horizontal pagination dots above vertical dots */}
        <View className="absolute bottom-40 left-0 right-0 flex-row justify-center space-x-2">
          {horizontalPages.map((_, index) => (
            <View
              key={index}
              className={`h-2 rounded-full ${
                index === currentHorizontalIndex ? 'w-2 bg-white' : 'w-2 bg-white/40'
              }`}
            />
          ))}
        </View>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-[#9AA793]">
      {/* Header with icons */}
      <View className="absolute top-0 left-0 right-0 z-10 flex-row justify-between items-center px-6 pt-14 pb-4">
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
        renderItem={({ item }) => <MantraCard item={item} />}
        keyExtractor={(item) => item.id}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToAlignment="start"
        decelerationRate="fast"
        snapToInterval={SCREEN_HEIGHT}
        onViewableItemsChanged={onVerticalViewableItemsChanged}
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
