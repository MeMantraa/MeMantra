import React, { useRef, useState, memo } from 'react';
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
  readonly onJournal?: (mantraId: number, mantraTitle: string) => void;
  readonly onReminder?: (mantraId: number) => void;
  readonly hasReminder?: boolean;
  readonly showButtons?: boolean;
  readonly onPress?: () => void;
  readonly isFocusMode?: boolean;
}

const MantraCarousel = memo(
  function MantraCarousel({
    item,
    onLike,
    onSave,
    onShare,
    onJournal,
    onReminder,
    hasReminder = false,
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

    const handleJournal = () => {
      if (onJournal) onJournal(item.mantra_id, item.title);
    };

    const handleReminder = () => {
      if (onReminder) onReminder(item.mantra_id);
    };

    return (
      <View
        style={{ height: SCREEN_HEIGHT, width: SCREEN_WIDTH }}
        className="items-center backgroundColor: colors.primary"
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
                      className="w-full justify-center items-center"
                      style={{ height: SCREEN_HEIGHT * 0.35, maxWidth: SCREEN_WIDTH - 100 }}
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
                      height: SCREEN_HEIGHT * 0.55,
                    }}
                    contentContainerStyle={{
                      paddingVertical: 10,
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
        <View className="absolute bottom-52 left-0 right-0 flex-row justify-center items-center">
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

        {showButtons && (
          <View className="absolute bottom-32 left-0 right-0 flex-row justify-between items-center px-4">
            {/* Left side buttons - Like and Share */}
            <View className="flex-row items-center">
              <View className="items-center mr-3">
                <IconButton type="like" active={!!item.isLiked} onPress={handleLike} size="small" />
                {item.like_count !== undefined && (
                  <AppText style={{ color: colors.text }} className="text-sm mt-1">
                    {item.like_count}
                  </AppText>
                )}
              </View>
              <View style={{ marginTop: -18 }}>
                <IconButton type="share" onPress={handleShare} size="small" />
              </View>
            </View>

            {/* Right side buttons - Reminder, Journal, and Save */}
            <View className="flex-row items-center">
              <View style={{ marginTop: -18 }}>
                <IconButton
                  type="reminder"
                  active={hasReminder}
                  onPress={handleReminder}
                  className="mr-3"
                  size="small"
                />
              </View>
              <View style={{ marginTop: -18 }}>
                <IconButton type="journal" onPress={handleJournal} className="mr-3" size="small" />
              </View>
              <View style={{ marginTop: -18 }}>
                <IconButton type="save" active={!!item.isSaved} onPress={handleSave} size="small" />
              </View>
            </View>
          </View>
        )}
      </View>
    );
  },
  (prevProps, nextProps) => {
    // Only re-render if these specific props change
    return (
      prevProps.item.mantra_id === nextProps.item.mantra_id &&
      prevProps.item.isLiked === nextProps.item.isLiked &&
      prevProps.item.isSaved === nextProps.item.isSaved &&
      prevProps.item.like_count === nextProps.item.like_count &&
      prevProps.hasReminder === nextProps.hasReminder &&
      prevProps.isFocusMode === nextProps.isFocusMode
    );
  },
);

export default MantraCarousel;
