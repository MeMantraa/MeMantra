import React, { useRef, useState } from 'react';
import { View, Text, Dimensions, FlatList, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Mantra } from '../services/mantra.service';
import LikeButton from '../components/UI/likeButton';
import SaveButton from '../components/UI/saveButton';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

interface MantraCarouselProps {
  item: Mantra;
  onLike?: (mantraId: number) => void;
  onSave?: (mantraId: number) => void;
}

export default function MantraCarousel({ item, onLike, onSave }: MantraCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Filter out pages with no content
  const pages = [
    { title: 'Mantra', content: item.title },
    { title: 'Key Takeaway', content: item.key_takeaway },
    item.background_author && item.background_description
      ? {
          title: 'Background',
          content: `${item.background_author}\n\n${item.background_description}`,
        }
      : null,
    item.jamie_take ? { title: "Jamie's Take", content: item.jamie_take } : null,
    item.when_where ? { title: 'When & Where?', content: item.when_where } : null,
    item.negative_thoughts
      ? { title: 'Negative Thoughts It Replaces', content: item.negative_thoughts }
      : null,
    item.cbt_principles ? { title: 'CBT Principles', content: item.cbt_principles } : null,
    item.references ? { title: 'References', content: item.references } : null,
  ].filter((page): page is { title: string; content: string } => page !== null);

  const onViewableChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) setCurrentIndex(viewableItems[0].index ?? 0);
  }).current;

  const handleLike = () => {
    if (onLike) onLike(item.mantra_id);
  };

  const handleSave = () => {
    if (onSave) onSave(item.mantra_id);
  };

  return (
    <View
      style={{ height: SCREEN_HEIGHT, width: SCREEN_WIDTH }}
      className="justify-center items-center bg-[#9AA793]"
    >
      <View className="absolute top-32 z-10">
        <Text className="text-white text-5xl opacity-50">" "</Text>
      </View>

      {/* Horizontal scroll through pages */}
      <View
        style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT }}
        className="justify-center items-center"
      >
        <FlatList
          data={pages}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          snapToAlignment="center"
          decelerationRate="fast"
          onViewableItemsChanged={onViewableChanged}
          viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
          keyExtractor={(_, i) => `${item.mantra_id}-${i}`}
          contentContainerStyle={{ alignItems: 'center' }}
          style={{ flexGrow: 0 }}
          renderItem={({ item: page, index }) => (
            <View style={{ width: SCREEN_WIDTH }} className="justify-center items-center px-6">
              {index === 0 ? (
                // First page (Mantra) - centered, no scroll
                <View
                  className="w-full max-w-[500px] justify-center items-center"
                  style={{ height: SCREEN_HEIGHT * 0.5 }}
                >
                  <Text className="text-white text-center leading-10 text-3xl font-light tracking-wide">
                    {page.content}
                  </Text>
                </View>
              ) : (
                // Other pages - scrollable
                <ScrollView
                  style={{
                    width: '100%',
                    maxWidth: 500,
                    height: SCREEN_HEIGHT * 0.55,
                  }}
                  contentContainerStyle={{
                    paddingVertical: 40,
                    paddingHorizontal: 24,
                    paddingBottom: 60,
                    paddingTop: 0,
                  }}
                  showsVerticalScrollIndicator={false}
                  nestedScrollEnabled={true}
                >
                  <View className="mb-6">
                    <Text className="text-[#E6D29C] text-2xl font-semibold text-center">
                      {page.title}
                    </Text>
                  </View>

                  <Text className="text-white  leading-7 text-base">{page.content}</Text>
                </ScrollView>
              )}
            </View>
          )}
        />
      </View>

      {/* Carousel dots */}
      <View className="absolute bottom-40 left-0 right-0 flex-row justify-center items-center">
        {pages.map((_, index) => (
          <View
            key={index}
            className={`h-2 rounded-full mx-1 ${
              index === currentIndex ? 'w-2 bg-white' : 'w-2 bg-white/40'
            }`}
          />
        ))}
      </View>

      {/* Action buttons */}
      <View className="absolute right-6 bottom-40 items-center">
        <SaveButton saved={!!item.isSaved} onPress={handleSave} />
        <LikeButton liked={!!item.isLiked} onPress={handleLike} />
      </View>
    </View>
  );
}
