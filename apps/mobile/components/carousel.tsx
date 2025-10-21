import React, { useRef, useState } from 'react';
import { View, Text, Dimensions, FlatList, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Mantra } from '../services/mantra.service';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

interface MantraWithState extends Mantra {
  isLiked: boolean;
  isSaved: boolean;
}

interface MantraCarouselProps {
  item: MantraWithState;
  onLike: (id: number) => void;
  onSave: (id: number) => void;
}

export default function MantraCarousel({ item, onLike, onSave }: MantraCarouselProps) {
  const [currentHorizontalIndex, setCurrentHorizontalIndex] = useState(0);

  const horizontalPages = [
    {
      type: 'mantra',
      title: 'Mantra',
      content: item.title,
    },
    {
      type: 'takeaway',
      title: 'Key Takeaway',
      content: item.key_takeaway,
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
      {/* Quotation marks */}
      <View className="absolute top-32 z-10">
        <Text className="text-white text-5xl opacity-50">" "</Text>
      </View>

      {/* Horizontal swiper */}
      <FlatList
        data={horizontalPages}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        snapToAlignment="center"
        decelerationRate="fast"
        onViewableItemsChanged={onHorizontalViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
        keyExtractor={(_, index) => `${item.mantra_id}-${index}`}
        renderItem={({ item: page }) => (
          <View style={{ width: SCREEN_WIDTH - 48 }} className="items-center justify-center">
            <View className="w-full rounded-3xl bg-[#9AA793] p-8 items-center justify-center min-h-[400px]">
              {page.type === 'mantra' ? (
                <>
                  <View className="items-center justify-center flex-1">
                    <Text className="text-white text-3xl font-light text-center tracking-wide">
                      {page.content}
                    </Text>
                  </View>
                </>
              ) : (
                <>
                  <View className="mb-6">
                    <Text className="text-[#E6D29C] text-xl font-semibold">{page.title}</Text>
                  </View>

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

      {/* Action buttons */}
      <View className="absolute right-6 bottom-40 items-center space-y-6">
        {/* Save */}
        <TouchableOpacity
          className="items-center justify-center"
          onPress={() => onSave(item.mantra_id)}
          activeOpacity={0.7}
        >
          <Ionicons name={item.isSaved ? 'bookmark' : 'bookmark-outline'} size={38} color="white" />
        </TouchableOpacity>

        {/* Like */}
        <TouchableOpacity
          className="items-center justify-center mt-6"
          onPress={() => onLike(item.mantra_id)}
          activeOpacity={0.7}
        >
          <Ionicons
            name={item.isLiked ? 'heart' : 'heart-outline'}
            size={38}
            color={item.isLiked ? '#ff4444' : 'white'}
          />
        </TouchableOpacity>
      </View>

      {/* Pagination dots */}
      <View
        style={{ gap: 3 }}
        className="absolute bottom-40 left-0 right-0 flex-row justify-center"
      >
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
}
