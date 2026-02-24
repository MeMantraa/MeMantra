import React, { useRef, useState, memo } from 'react';
import {
  View,
  Dimensions,
  FlatList,
  ScrollView,
  TouchableWithoutFeedback,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
    const [isActionsModalVisible, setIsActionsModalVisible] = useState(false);
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

    const openActionsModal = () => {
      setIsActionsModalVisible(true);
    };

    const closeActionsModal = () => {
      setIsActionsModalVisible(false);
    };
    const modalFontSize = 24;
    const modalLineHeight = 30;

    return (
      <View
        style={{ height: SCREEN_HEIGHT, width: SCREEN_WIDTH, paddingBottom: 132 }}
        className="items-center"
      >
        <View className="pt-36 mb-6">
          <AppText style={{ color: colors.text }} className="text-6xl opacity-50">
            " "
          </AppText>
        </View>

        {/* Horizontal scroll through pages */}
        <View style={{ width: SCREEN_WIDTH }} className="pt-2 justify-center items-center">
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
                      style={{ height: SCREEN_HEIGHT * 0.3, maxWidth: SCREEN_WIDTH - 100 }}
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
                      height: SCREEN_HEIGHT * 0.45,
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
        <View className="flex-row justify-center items-center mt-10">
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
          <View className="absolute left-0 right-0 px-10" style={{ bottom: 136 }}>
            <View className="w-full flex-row items-end justify-between">
              <TouchableOpacity
                testID="more-button"
                activeOpacity={0.8}
                onPress={openActionsModal}
                className="items-center justify-center rounded-full"
                style={{
                  width: 72,
                  height: 72,
                  backgroundColor: colors.primaryDark,
                }}
              >
                <Ionicons name="share-outline" size={35} color={colors.text} />
              </TouchableOpacity>

              <View className="items-center">
                <IconButton type="save" active={!!item.isSaved} onPress={handleSave} />
                <View className="h-3" />
                <IconButton type="like" active={!!item.isLiked} onPress={handleLike} />
                {item.like_count !== undefined && (
                  <AppText style={{ color: colors.text }} className="text-sm mt-1">
                    {item.like_count}
                  </AppText>
                )}
              </View>
            </View>
          </View>
        )}

        <Modal
          visible={isActionsModalVisible}
          animationType="fade"
          transparent={false}
          onRequestClose={closeActionsModal}
        >
          <View
            className="flex-1"
            style={{
              backgroundColor: colors.primaryDark,
              paddingTop: 66,
              paddingHorizontal: 20,
              paddingBottom: 36,
            }}
          >
            <TouchableOpacity
              onPress={closeActionsModal}
              testID="close-actions-modal"
              className="w-10 h-10 items-center justify-center"
              accessibilityRole="button"
            >
              <Ionicons name="arrow-back" size={30} color={colors.text} />
            </TouchableOpacity>

            <View className="flex-1 justify-center">
              <View
                className="overflow-hidden"
                style={{ backgroundColor: colors.primary, borderRadius: 26 }}
              >
                <ScrollView
                  style={{ height: SCREEN_HEIGHT * 0.48, width: '100%' }}
                  contentContainerStyle={{
                    minHeight: SCREEN_HEIGHT * 0.48,
                    justifyContent: 'center',
                    alignItems: 'center',
                    paddingHorizontal: 32,
                    paddingVertical: 22,
                  }}
                  showsVerticalScrollIndicator={false}
                >
                  <AppText
                    style={{ color: colors.text }}
                    className="text-4xl opacity-60 text-center mb-10"
                  >
                    " "
                  </AppText>
                  <AppText
                    style={{
                      color: colors.text,
                      fontSize: modalFontSize,
                      lineHeight: modalLineHeight,
                      maxWidth: '80%',
                    }}
                    className="text-center font-light"
                  >
                    {item.title}
                  </AppText>
                </ScrollView>
                <View style={{ height: 74, backgroundColor: '#CFCFD1' }} />
              </View>
            </View>

            <View className="flex-row items-center justify-between px-1">
              <TouchableOpacity
                activeOpacity={0.8}
                className="w-16 h-16 rounded-full items-center justify-center"
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.28)' }}
                onPress={() => {
                  handleReminder();
                  closeActionsModal();
                }}
                testID="reminder-button"
              >
                <Ionicons
                  name={hasReminder ? 'notifications' : 'notifications-outline'}
                  size={28}
                  color={hasReminder ? colors.secondary : colors.text}
                />
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.8}
                className="w-16 h-16 rounded-full items-center justify-center"
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.28)' }}
                onPress={() => {
                  handleShare();
                  closeActionsModal();
                }}
                testID="share-button"
              >
                <Ionicons name="paper-plane-outline" size={28} color={colors.text} />
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.8}
                className="w-16 h-16 rounded-full items-center justify-center"
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.28)' }}
                onPress={() => {
                  handleJournal();
                  closeActionsModal();
                }}
                testID="journal-button"
              >
                <Ionicons name="book-outline" size={29} color={colors.text} />
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.8}
                className="w-16 h-16 rounded-full items-center justify-center"
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.28)' }}
                onPress={() => {
                  handleSave();
                  closeActionsModal();
                }}
                testID="modal-save-button"
              >
                <Ionicons
                  name={item.isSaved ? 'star' : 'star-outline'}
                  size={30}
                  color={colors.secondary}
                />
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.8}
                className="w-16 h-16 rounded-full items-center justify-center"
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.28)' }}
                onPress={closeActionsModal}
                testID="modal-more-button"
              >
                <Ionicons name="ellipsis-horizontal" size={30} color={colors.text} />
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
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
