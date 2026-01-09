import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Animated, Text, Pressable, Platform, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

type SavedPopupBarProps = {
  readonly visible: boolean;
  readonly message?: string;
  readonly onHide: () => void;
  readonly durationMs?: number;
  readonly onPressCollections: () => void;
  readonly onRate?: (rating: number) => void;
};

export default function SavedPopupBar({
  visible,
  message = 'Saved successfully',
  onHide,
  durationMs = 5000,
  onPressCollections,
  onRate,
}: SavedPopupBarProps) {
  const { colors } = useTheme();
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(10)).current;
  const [hasRated, setHasRated] = useState(false);
  const [hoveredStar, setHoveredStar] = useState(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const animateTo = useCallback(
    (toValue: 0 | 1, cb?: () => void) => {
      Animated.parallel([
        Animated.timing(opacity, { toValue, duration: 200, useNativeDriver: true }),
        Animated.timing(translateY, {
          toValue: toValue ? 0 : 10,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => finished && cb?.());
    },
    [opacity, translateY],
  );

  const clearAutoHideTimer = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const startAutoHideTimer = useCallback(() => {
    clearAutoHideTimer();
    timeoutRef.current = setTimeout(() => {
      animateTo(0, () => {
        onHide();
        setHasRated(false);
      });
    }, durationMs);
  }, [clearAutoHideTimer, animateTo, onHide, durationMs]);

  useEffect(() => {
    if (!visible) return;

    setHasRated(false);
    animateTo(1);
    startAutoHideTimer();

    return () => clearAutoHideTimer();
  }, [visible, animateTo, startAutoHideTimer, clearAutoHideTimer]);

  const handleStarPress = (rating: number) => {
    setHasRated(true);
    onRate?.(rating);

    // Auto-hide after rating
    clearAutoHideTimer();
    setTimeout(() => {
      animateTo(0, () => {
        onHide();
        setHasRated(false);
      });
    }, 3000);
  };

  if (!visible) return null;

  return (
    <Animated.View
      testID="saved-popup-bar"
      className="absolute left-4 right-4 rounded-2xl px-5 py-4 border"
      style={{
        bottom: Platform.OS === 'ios' ? 34 : 16,
        opacity,
        transform: [{ translateY }],
        backgroundColor: colors.secondary,
        borderColor: colors.secondary,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 6,
      }}
    >
      {/* Success message with collections link */}
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center">
          <Ionicons
            name="checkmark-circle"
            size={20}
            color={colors.primaryDark ?? '#fff'}
            style={{ marginRight: 6 }}
          />
          <Text
            className="text-[15px] font-semibold"
            style={{ color: colors.primaryDark ?? '#fff' }}
          >
            {message}
          </Text>
        </View>

        <Pressable
          testID="collections-button"
          onPress={onPressCollections}
          hitSlop={10}
          className="flex-row items-center"
        >
          <Text
            className="text-[14px] font-medium underline"
            style={{ color: colors.primaryDark ?? '#fff', opacity: 0.9 }}
          >
            Collections
          </Text>
          <Ionicons
            name="chevron-forward"
            size={16}
            color={colors.primaryDark ?? '#fff'}
            style={{ opacity: 0.9 }}
          />
        </Pressable>
      </View>

      {/* Rating section */}
      {!hasRated ? (
        <>
          <Text
            className="text-[14px] mb-2 text-center"
            style={{ color: colors.primaryDark ?? '#fff', opacity: 0.85 }}
          >
            Rate this mantra?
          </Text>

          <View className="items-center">
            <View className="flex-row gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Pressable
                  key={star}
                  testID={`star-button-${star}`}
                  onPress={() => handleStarPress(star)}
                  onPressIn={() => setHoveredStar(star)}
                  onPressOut={() => setHoveredStar(0)}
                  hitSlop={4}
                >
                  <Ionicons
                    name={hoveredStar >= star ? 'star' : 'star-outline'}
                    size={28}
                    color={colors.primaryDark ?? '#fff'}
                    style={{
                      opacity: hoveredStar >= star ? 1 : 0.6,
                    }}
                  />
                </Pressable>
              ))}
            </View>
          </View>
        </>
      ) : (
        <View className="flex-row items-center justify-center">
          <Text
            testID="thank-you-message"
            className="text-[14px] font-medium"
            style={{ color: colors.primaryDark ?? '#fff', opacity: 0.9 }}
          >
            Thanks for rating!
          </Text>
        </View>
      )}
    </Animated.View>
  );
}
