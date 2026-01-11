import React, { useRef, useState } from 'react';
import { View, Dimensions, FlatList, ScrollView, TouchableWithoutFeedback } from 'react-native';
import { Mantra } from '../services/mantra.service';
import IconButton from '../components/UI/iconButton';
import AppText from './UI/textWrapper';
import { useTheme } from '../context/ThemeContext';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

interface MantraCarouselProps {
  readonly item: Mantra;
  readonly onLike?: (mantraId: number) => void;
  readonly onSave?: (mantraId: number) => void;
  readonly onShare?: (mantraId: number) => void;
  readonly showButtons?: boolean;
  readonly onPress?: () => void;
  readonly isFocusMode?: boolean;
}

export default function MantraCarousel({
  item,
  onLike,
  onSave,
  onShare,
  showButtons = true,
  onPress,
  isFocusMode = false,
}: Readonly<MantraCarouselProps>) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const { colors } = useTheme();

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

  const handleShare = () => {
    if (onShare) onShare(item.mantra_id);
  };

  return (
    <View
      style={{ height: SCREEN_HEIGHT, width: SCREEN_WIDTH }}
      className="justify-center items-center  backgroundColor: colors.primary"
    >
      <View className="absolute top-36 z-11">
        <AppText style={{ color: colors.text }} className="text-6xl opacity-50">
          " "
        </AppText>
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
                /* MANTRA PAGE */
                <TouchableWithoutFeedback onPress={onPress}>
                  <View
                    className="w-full max-w-[500px] justify-center items-center"
                    style={{ height: SCREEN_HEIGHT * 0.5 }}
                  >
                    <AppText
                      style={{ color: colors.text }}
                      className={`text-center leading-10 font-light tracking-wide ${isFocusMode ? 'text-4xl' : 'text-3xl'}`}
                    >
                      {page.content}
                    </AppText>
                  </View>
                </TouchableWithoutFeedback>
              ) : (
                /* OTHER PAGES */
                <ScrollView
                  style={{
                    width: '100%',
                    maxWidth: 500,
                    height: SCREEN_HEIGHT * 0.6,
                  }}
                  contentContainerStyle={{
                    paddingVertical: 40,
                    paddingHorizontal: 24,
                    paddingBottom: 60,
                  }}
                  showsVerticalScrollIndicator={false}
                  nestedScrollEnabled={true}
                >
                  <View className="mb-6">
                    <AppText
                      style={{ color: colors.secondary }}
                      className=" text-3xl font-semibold text-center"
                    >
                      {page.title}
                    </AppText>
                  </View>

                  <AppText
                    style={{ color: colors.text }}
                    className={`leading-7 ${isFocusMode ? 'text-xl' : 'text-lg'}`}
                  >
                    {page.content}
                  </AppText>
                </ScrollView>
              )}
            </View>
          )}
        />
      </View>

      {/* Carousel dots */}
      <View className="absolute bottom-40 left-0 right-0 flex-row justify-center items-center">
        {pages.map((page) => (
          <View
            key={`${item.mantra_id}-${page.title}`}
            className={`h-2 rounded-full mx-1 ${
              pages.indexOf(page) === currentIndex ? 'w-2' : 'w-2 opacity-40'
            }`}
            style={{ backgroundColor: colors.text }}
          />
        ))}
      </View>

      {/* Action buttons */}
      {showButtons && (
        <View className="absolute right-6 bottom-40 items-center">
          <IconButton type="save" active={!!item.isSaved} onPress={handleSave} className="mb-6" />
          <IconButton type="like" active={!!item.isLiked} onPress={handleLike} className="mb-6" />
          <IconButton type="share" onPress={handleShare} className="mb-6" />
        </View>
      )}
    </View>
  );
}
