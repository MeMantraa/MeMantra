import React, { useRef, useState, memo } from 'react';
import {
  View,
  Dimensions,
  FlatList,
  TouchableWithoutFeedback,
  TouchableOpacity,
  Animated,
  Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Mantra } from '../services/mantra.service';
import IconButton from '../components/UI/iconButton';
import AppText from './UI/textWrapper';
import { useTheme } from '../context/ThemeContext';
import DeepDiveReader from './deepDive/DeepDiveReader';

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

type CarouselPage = {
  title: string;
  content: string;
  kind: 'deep-dive' | 'references';
};

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
    const [isReaderScrolling, setIsReaderScrolling] = useState(false);
    const [isMoreExpanded, setIsMoreExpanded] = useState(false);
    const moreAnim = useRef(new Animated.Value(0)).current;
    const deepDiveBarAnim = useRef(new Animated.Value(0)).current;
    const dotAnim = useRef(new Animated.Value(0)).current;
    const { colors } = useTheme();
    const moreMenuExpandedHeight = onPress ? 166 : 112;
    const reservedRightSpace = 0;
    const deepDiveHeaderInsetLeft = showButtons ? 54 : 0;
    const deepDiveHeaderInsetTop = showButtons ? 6 : 0;
    const firstPageMaxWidth = showButtons ? SCREEN_WIDTH - 190 : SCREEN_WIDTH - 72;
    const isDeepDivePage = currentIndex > 0;
    const deepDiveMenuExpandedWidth = onPress ? 152 : 104;
    const deepDiveHeightRatio =
      SCREEN_HEIGHT < 700 ? 0.69 : SCREEN_HEIGHT < 820 ? 0.65 : SCREEN_HEIGHT < 920 ? 0.62 : 0.6;
    const deepDiveActionBarBottom = SCREEN_HEIGHT < 760 ? 118 : 106;
    const deepDiveDotsBottom = deepDiveActionBarBottom + (SCREEN_HEIGHT < 760 ? 96 : 90);
    const mantraDotsBottom = SCREEN_HEIGHT < 760 ? 164 : 148;
    const isDeepDiveBarVisible = isDeepDivePage && !isReaderScrolling;

    const pages = [
      { title: 'Mantra', content: item.title, kind: 'deep-dive' as const },
      { title: 'Key Takeaway', content: item.key_takeaway, kind: 'deep-dive' as const },
      item.background_author && item.background_description
        ? {
            title: 'Background',
            content: `${item.background_author}\n\n${item.background_description}`,
            kind: 'deep-dive' as const,
          }
        : null,
      item.jamie_take
        ? { title: "Jamie's Take", content: item.jamie_take, kind: 'deep-dive' as const }
        : null,
      item.when_where
        ? { title: 'When & Where?', content: item.when_where, kind: 'deep-dive' as const }
        : null,
      item.negative_thoughts
        ? {
            title: 'Negative Thoughts It Replaces',
            content: item.negative_thoughts,
            kind: 'deep-dive' as const,
          }
        : null,
      item.cbt_principles
        ? { title: 'CBT Principles', content: item.cbt_principles, kind: 'deep-dive' as const }
        : null,
      item.references
        ? { title: 'References', content: item.references, kind: 'references' as const }
        : null,
    ].filter((page): page is CarouselPage => page !== null);

    const onViewableChanged = useRef(({ viewableItems }: any) => {
      if (viewableItems.length > 0) {
        const nextIndex = viewableItems[0].index ?? 0;
        setCurrentIndex(nextIndex);
        Animated.spring(dotAnim, {
          toValue: nextIndex,
          tension: 130,
          friction: 12,
          useNativeDriver: false,
        }).start();
      }
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

    const handleOpenFocus = () => {
      if (onPress) onPress();
    };

    const toggleMoreExpanded = () => {
      setIsMoreExpanded((prev) => !prev);
    };

    React.useEffect(() => {
      Animated.timing(moreAnim, {
        toValue: isMoreExpanded ? 1 : 0,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
    }, [isMoreExpanded, moreAnim]);

    React.useEffect(() => {
      Animated.spring(deepDiveBarAnim, {
        toValue: isDeepDiveBarVisible ? 1 : 0,
        tension: 120,
        friction: 14,
        useNativeDriver: true,
      }).start();

      if (!isDeepDiveBarVisible) {
        setIsMoreExpanded(false);
      }
    }, [isDeepDiveBarVisible, deepDiveBarAnim]);

    React.useEffect(() => {
      if (!isDeepDivePage) {
        setIsReaderScrolling(false);
      }
    }, [isDeepDivePage]);

    return (
      <View
        style={{
          height: SCREEN_HEIGHT,
          width: SCREEN_WIDTH,
          paddingBottom: 132,
          overflow: 'hidden',
        }}
        className="items-center"
      >
        <View
          style={{
            paddingTop: isDeepDivePage ? 52 : 96,
            marginBottom: isDeepDivePage ? 0 : 6,
          }}
        >
          <AppText style={{ color: colors.text }} className="text-6xl opacity-35">
            " "
          </AppText>
        </View>

        <View style={{ width: SCREEN_WIDTH }} className="justify-center items-center">
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
              <View
                style={{
                  width: SCREEN_WIDTH,
                  paddingHorizontal: index === 0 ? 24 : 10,
                  overflow: 'hidden',
                }}
                className="justify-center items-center"
              >
                {index === 0 ? (
                  /* MANTRA PAGE */
                  <TouchableWithoutFeedback onPress={onPress}>
                    <View
                      className="w-full justify-center items-center"
                      style={{ height: SCREEN_HEIGHT * 0.35, maxWidth: firstPageMaxWidth }}
                    >
                      <AppText
                        style={{
                          color: colors.text,
                          textShadowColor: 'rgba(0, 0, 0, 0.10)',
                          textShadowOffset: { width: 0, height: 1 },
                          textShadowRadius: 4,
                          lineHeight: isFocusMode ? 52 : 46,
                        }}
                        className={`text-center font-normal tracking-wide ${isFocusMode ? 'text-4xl' : 'text-3xl'}`}
                      >
                        {page.content}
                      </AppText>
                    </View>
                  </TouchableWithoutFeedback>
                ) : (
                  /* OTHER PAGES */
                  <View
                    style={{
                      width: '100%',
                      maxWidth: SCREEN_WIDTH - 20,
                      height: SCREEN_HEIGHT * deepDiveHeightRatio,
                    }}
                  >
                    <DeepDiveReader
                      title={page.title}
                      content={page.content}
                      referencesOnly={page.kind === 'references'}
                      reserveRightSpace={reservedRightSpace}
                      headerInsetLeft={deepDiveHeaderInsetLeft}
                      headerInsetTop={deepDiveHeaderInsetTop}
                      onToggleFocus={onPress}
                      onScrollStateChange={setIsReaderScrolling}
                    />
                  </View>
                )}
              </View>
            )}
          />
        </View>

        {/* Carousel dots */}
        <View
          pointerEvents="none"
          className="absolute left-0 right-0 flex-row justify-center items-center"
          style={{ bottom: isDeepDivePage ? deepDiveDotsBottom : mantraDotsBottom, zIndex: 30 }}
        >
          {pages.map((page, index) => (
            <Animated.View
              key={`${item.mantra_id}-${page.title}`}
              className="rounded-full mx-1"
              style={{
                height: 8,
                width: dotAnim.interpolate({
                  inputRange: [index - 1, index, index + 1],
                  outputRange: [8, 18, 8],
                  extrapolate: 'clamp',
                }),
                opacity: dotAnim.interpolate({
                  inputRange: [index - 1, index, index + 1],
                  outputRange: [0.4, 1, 0.4],
                  extrapolate: 'clamp',
                }),
                backgroundColor: colors.text,
                transform: [
                  {
                    scale: dotAnim.interpolate({
                      inputRange: [index - 1, index, index + 1],
                      outputRange: [1, 1.08, 1],
                      extrapolate: 'clamp',
                    }),
                  },
                ],
              }}
            />
          ))}
        </View>

        {showButtons &&
          (isDeepDivePage ? (
            <Animated.View
              pointerEvents={isDeepDiveBarVisible ? 'auto' : 'none'}
              className="absolute left-0 right-0 items-center"
              style={{
                bottom: deepDiveActionBarBottom,
                opacity: deepDiveBarAnim,
                zIndex: 20,
                transform: [
                  {
                    translateY: deepDiveBarAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [16, 0],
                    }),
                  },
                ],
              }}
            >
              <Animated.View
                pointerEvents={isMoreExpanded ? 'auto' : 'none'}
                style={{
                  marginBottom: 10,
                  backgroundColor: 'rgba(109, 126, 104, 0.96)',
                  borderRadius: 999,
                  paddingHorizontal: 8,
                  height: 56,
                  width: moreAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, deepDiveMenuExpandedWidth],
                  }),
                  opacity: moreAnim,
                  overflow: 'hidden',
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
              >
                {!!onPress && (
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => {
                      handleOpenFocus();
                      setIsMoreExpanded(false);
                    }}
                    testID="focus-button"
                    className="w-10 h-10 rounded-full items-center justify-center"
                    style={{ backgroundColor: 'rgba(255, 255, 255, 0.3)' }}
                  >
                    <Ionicons name="scan-outline" size={20} color={colors.text} />
                  </TouchableOpacity>
                )}
                {!!onPress && <View style={{ width: 8 }} />}
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => {
                    handleJournal();
                    setIsMoreExpanded(false);
                  }}
                  testID="journal-button"
                  className="w-10 h-10 rounded-full items-center justify-center"
                  style={{ backgroundColor: 'rgba(255, 255, 255, 0.3)' }}
                >
                  <Ionicons name="book-outline" size={20} color={colors.text} />
                </TouchableOpacity>
                <View style={{ width: 8 }} />
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => {
                    handleShare();
                    setIsMoreExpanded(false);
                  }}
                  testID="share-button"
                  className="w-10 h-10 rounded-full items-center justify-center"
                  style={{ backgroundColor: 'rgba(255, 255, 255, 0.3)' }}
                >
                  <Ionicons name="paper-plane-outline" size={20} color={colors.text} />
                </TouchableOpacity>
              </Animated.View>

              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  borderRadius: 999,
                  paddingHorizontal: 10,
                  paddingVertical: 8,
                  backgroundColor: colors.primaryDark + 'dd',
                  borderWidth: 1,
                  borderColor: colors.text + '20',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 6 },
                  shadowOpacity: 0.14,
                  shadowRadius: 10,
                  elevation: 6,
                }}
              >
                <TouchableOpacity
                  testID="more-button"
                  activeOpacity={0.8}
                  onPress={toggleMoreExpanded}
                  className="items-center justify-center rounded-full"
                  style={{ width: 36, height: 36, backgroundColor: colors.primaryDark }}
                >
                  <Ionicons
                    name={isMoreExpanded ? 'close' : 'ellipsis-horizontal'}
                    size={20}
                    color={colors.text}
                  />
                </TouchableOpacity>
                <View style={{ width: 6 }} />
                <IconButton
                  type="reminder"
                  active={hasReminder}
                  onPress={handleReminder}
                  size="small"
                />
                <View style={{ width: 6 }} />
                <IconButton type="save" active={!!item.isSaved} onPress={handleSave} size="small" />
                <View style={{ width: 6 }} />
                <View style={{ alignItems: 'center' }}>
                  <IconButton
                    type="like"
                    active={!!item.isLiked}
                    onPress={handleLike}
                    size="small"
                  />
                  {item.like_count !== undefined && (
                    <AppText
                      style={{ color: colors.text, opacity: 0.9, fontSize: 11, marginTop: 2 }}
                    >
                      {item.like_count}
                    </AppText>
                  )}
                </View>
              </View>
            </Animated.View>
          ) : (
            <View className="absolute left-0 right-0 px-10" style={{ bottom: 156 }}>
              <View className="w-full flex-row items-end justify-between">
                <View className="items-start">
                  <Animated.View
                    pointerEvents={isMoreExpanded ? 'auto' : 'none'}
                    className="rounded-3xl px-2 py-2 items-center"
                    style={{
                      marginBottom: moreAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 12],
                      }),
                      backgroundColor: 'rgba(109, 126, 104, 0.95)',
                      width: 56,
                      height: moreAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, moreMenuExpandedHeight],
                      }),
                      opacity: moreAnim,
                      overflow: 'hidden',
                      transform: [
                        {
                          translateY: moreAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [8, 0],
                          }),
                        },
                      ],
                    }}
                  >
                    <View className="items-center">
                      {!!onPress && (
                        <TouchableOpacity
                          activeOpacity={0.8}
                          onPress={() => {
                            handleOpenFocus();
                            setIsMoreExpanded(false);
                          }}
                          testID="focus-button"
                          className="w-12 h-12 rounded-full items-center justify-center mb-2"
                          style={{ backgroundColor: 'rgba(255, 255, 255, 0.3)' }}
                        >
                          <Ionicons name="scan-outline" size={24} color={colors.text} />
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => {
                          handleJournal();
                          setIsMoreExpanded(false);
                        }}
                        testID="journal-button"
                        className="w-12 h-12 rounded-full items-center justify-center mb-2"
                        style={{ backgroundColor: 'rgba(255, 255, 255, 0.3)' }}
                      >
                        <Ionicons name="book-outline" size={24} color={colors.text} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => {
                          handleShare();
                          setIsMoreExpanded(false);
                        }}
                        testID="share-button"
                        className="w-12 h-12 rounded-full items-center justify-center"
                        style={{ backgroundColor: 'rgba(255, 255, 255, 0.3)' }}
                      >
                        <Ionicons name="paper-plane-outline" size={24} color={colors.text} />
                      </TouchableOpacity>
                    </View>
                  </Animated.View>

                  <TouchableOpacity
                    testID="more-button"
                    activeOpacity={0.8}
                    onPress={toggleMoreExpanded}
                    className="items-center justify-center rounded-full"
                    style={{
                      width: 55,
                      height: 55,
                      backgroundColor: colors.primaryDark,
                    }}
                  >
                    <Ionicons
                      name={isMoreExpanded ? 'close' : 'ellipsis-horizontal'}
                      size={30}
                      color={colors.text}
                    />
                  </TouchableOpacity>
                </View>

                <View className="items-center">
                  <IconButton type="reminder" active={hasReminder} onPress={handleReminder} />
                  <View className="h-3" />
                  <IconButton type="save" active={!!item.isSaved} onPress={handleSave} />
                  <View className="h-3" />
                  <View className="items-center">
                    <IconButton type="like" active={!!item.isLiked} onPress={handleLike} />
                    {item.like_count !== undefined && (
                      <AppText
                        style={{ color: colors.text, opacity: 0.95 }}
                        className="text-sm absolute -bottom-7"
                      >
                        {item.like_count}
                      </AppText>
                    )}
                  </View>
                </View>
              </View>
            </View>
          ))}
      </View>
    );
  },
  (prevProps, nextProps) => {
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
