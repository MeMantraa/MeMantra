import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Modal,
  Pressable,
  View,
  SectionList,
  PanResponder,
  Dimensions,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import AppText from './UI/textWrapper';
import { Category } from '../services/category.service';

type Props = {
  readonly visible: boolean;
  readonly categories: Category[];
  readonly selectedCategoryIds: number[];
  readonly onApply: (selectedIds: number[]) => void;
  readonly onClose: () => void;
  readonly loading?: boolean;
};

const { height: H } = Dimensions.get('window');
const MAX_H = H * 0.7;
const OFFSCREEN = H;
const THRESHOLD = 140;

// parent category labels
const SECTION_LABELS: Record<string, string> = {
  essential: 'Essentials',
  goal: 'Goal-Based Categories',
  mood: 'Mood / Emotion-Based',
  scenario: 'Life Scenarios',
  time: 'Times of Day / Year',
  theme: 'Values / Inspirational Themes',
};

const SECTION_ORDER = ['essential', 'goal', 'mood', 'scenario', 'time', 'theme'];

export default function CategoryFilterSheet({
  visible,
  categories,
  selectedCategoryIds,
  onApply,
  onClose,
  loading = false,
}: Props) {
  const { colors } = useTheme();
  const slide = useRef(new Animated.Value(0)).current;
  const dragY = useRef(new Animated.Value(0)).current;
  const [localSelected, setLocalSelected] = useState<number[]>(selectedCategoryIds);
  const [isDragging, setIsDragging] = useState(false);

  const closeSheet = () => {
    setIsDragging(false);
    Animated.parallel([
      Animated.timing(dragY, { toValue: OFFSCREEN, duration: 220, useNativeDriver: true }),
      Animated.timing(slide, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]).start(({ finished }) => finished && (dragY.setValue(0), onClose()));
  };

  const snapBack = () => {
    setIsDragging(false);
    Animated.spring(dragY, { toValue: 0, useNativeDriver: true, bounciness: 0, speed: 18 }).start();
  };

  useEffect(() => {
    if (visible) {
      setLocalSelected(selectedCategoryIds);
      dragY.setValue(0);
      Animated.timing(slide, { toValue: 1, duration: 260, useNativeDriver: true }).start();
    } else {
      dragY.setValue(0);
      slide.setValue(0);
      setIsDragging(false);
    }
  }, [visible]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dy) > 4 && Math.abs(g.dy) > Math.abs(g.dx),
      onPanResponderGrant: () => setIsDragging(true),
      onPanResponderMove: (_e, g) => dragY.setValue(Math.max(-18, g.dy)),
      onPanResponderRelease: (_e, g) =>
        g.dy > THRESHOLD || g.vy > 1.2 ? closeSheet() : snapBack(),
      onPanResponderTerminate: snapBack,
    }),
  ).current;

  const toggleCategory = (categoryId: number) => {
    setLocalSelected((prev) =>
      prev.includes(categoryId) ? prev.filter((id) => id !== categoryId) : [...prev, categoryId],
    );
  };

  const handleApply = () => {
    onApply(localSelected);
    closeSheet();
  };

  const handleClear = () => {
    setLocalSelected([]);
  };

  // group categories by parent_id and category_type for section list
  const sections = useMemo(() => {
    const topLevel = categories.filter((c) => !c.parent_id);
    const grouped: Record<string, Category[]> = {};
    for (const cat of topLevel) {
      const type = cat.category_type || 'other';
      if (!grouped[type]) grouped[type] = [];
      grouped[type].push(cat);
    }
    return SECTION_ORDER.filter((type) => grouped[type]?.length).map((type) => ({
      title: SECTION_LABELS[type] || type,
      data: grouped[type],
    }));
  }, [categories]);

  const backdropOpacity = slide.interpolate({ inputRange: [0, 1], outputRange: [0, 0.5] });
  const translateY = Animated.add(
    slide.interpolate({ inputRange: [0, 1], outputRange: [OFFSCREEN, 0] }),
    dragY,
  );

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={closeSheet}>
      <View className="flex-1" testID="category-filter-sheet">
        <Pressable className="absolute inset-0" onPress={closeSheet}>
          <Animated.View
            className="flex-1"
            style={{ backgroundColor: '#000', opacity: backdropOpacity }}
          />
        </Pressable>

        <Animated.View
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            maxHeight: MAX_H,
            backgroundColor: colors.primary,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            transform: [{ translateY }],
            overflow: 'hidden',
          }}
        >
          <View {...panResponder.panHandlers} className="items-center pt-3 pb-2">
            <View
              style={{
                width: 40,
                height: 5,
                borderRadius: 3,
                backgroundColor: colors.secondary,
                opacity: 0.5,
              }}
            />
          </View>

          <View className="flex-row justify-between items-center px-5 pb-3">
            <AppText className="text-lg font-bold" style={{ color: colors.text }}>
              Filter by Category
            </AppText>
            <View className="flex-row items-center" style={{ gap: 12 }}>
              {localSelected.length > 0 && (
                <TouchableOpacity onPress={handleClear} testID="clear-filter-btn">
                  <AppText className="text-sm" style={{ color: colors.secondary }}>
                    Clear
                  </AppText>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={handleApply}
                testID="apply-filter-btn"
                className="rounded-full px-4 py-2"
                style={{ backgroundColor: colors.secondary }}
              >
                <AppText className="text-sm font-semibold" style={{ color: colors.primary }}>
                  Apply{localSelected.length > 0 ? ` (${localSelected.length})` : ''}
                </AppText>
              </TouchableOpacity>
            </View>
          </View>

          {loading ? (
            <View className="flex-1 justify-center items-center py-8">
              <ActivityIndicator size="large" color={colors.secondary} />
            </View>
          ) : sections.length === 0 ? (
            <View className="flex-1 justify-center items-center py-8">
              <AppText className="text-base" style={{ color: colors.text }}>
                No categories available
              </AppText>
            </View>
          ) : (
            <SectionList
              sections={sections}
              keyExtractor={(item) => item.category_id.toString()}
              contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 30 }}
              showsVerticalScrollIndicator={false}
              stickySectionHeadersEnabled={false}
              renderSectionHeader={({ section: { title } }) => (
                <View
                  className="pt-4 pb-2"
                  style={{ borderBottomWidth: 1, borderBottomColor: `${colors.secondary}30` }}
                >
                  <AppText
                    className="text-xs font-bold tracking-wide"
                    style={{
                      color: colors.secondary,
                      textTransform: 'uppercase',
                      letterSpacing: 1,
                    }}
                  >
                    {title}
                  </AppText>
                </View>
              )}
              renderItem={({ item }) => {
                const isSelected = localSelected.includes(item.category_id);
                return (
                  <TouchableOpacity
                    testID={`category-filter-item-${item.category_id}`}
                    onPress={() => toggleCategory(item.category_id)}
                    className="flex-row items-center py-3"
                    style={{
                      borderBottomWidth: 0.5,
                      borderBottomColor: `${colors.text}20`,
                    }}
                  >
                    <View
                      className="rounded-full items-center justify-center mr-3"
                      style={{
                        width: 28,
                        height: 28,
                        borderWidth: 2,
                        borderColor: isSelected ? colors.secondary : `${colors.text}40`,
                        backgroundColor: isSelected ? colors.secondary : 'transparent',
                      }}
                    >
                      {isSelected && <Ionicons name="checkmark" size={18} color={colors.primary} />}
                    </View>
                    <View className="flex-1">
                      <AppText
                        className="text-base font-medium"
                        style={{ color: isSelected ? colors.secondary : colors.text }}
                      >
                        {item.name}
                      </AppText>
                      {item.description ? (
                        <AppText
                          className="text-xs mt-0.5"
                          style={{ color: `${colors.text}80` }}
                          numberOfLines={1}
                        >
                          {item.description}
                        </AppText>
                      ) : null}
                    </View>
                  </TouchableOpacity>
                );
              }}
            />
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}
