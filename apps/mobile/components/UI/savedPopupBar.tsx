import React, { useEffect, useRef } from 'react';
import { Animated, Text, Pressable, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

type SavedPopupBarProps = {
  readonly visible: boolean;
  readonly message?: string;
  readonly onHide: () => void;
  readonly durationMs?: number;
  readonly onPressCollections: () => void;
};

export default function SavedPopupBar({
  visible,
  message = 'Saved successfully',
  onHide,
  durationMs = 2000,
  onPressCollections,
}: SavedPopupBarProps) {
  const { colors } = useTheme();
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(10)).current;

  const animateTo = (toValue: 0 | 1, cb?: () => void) => {
    Animated.parallel([
      Animated.timing(opacity, { toValue, duration: 160, useNativeDriver: true }),
      Animated.timing(translateY, {
        toValue: toValue ? 0 : 10,
        duration: 160,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => finished && cb?.());
  };

  useEffect(() => {
    if (!visible) return;
    animateTo(1);
    const timer = setTimeout(() => {
      animateTo(0, onHide);
    }, durationMs);
    return () => clearTimeout(timer);
  }, [visible, durationMs, onHide]);

  if (!visible) return null;

  return (
    <Animated.View
      className="absolute left-4 right-4 rounded-xl px-4 py-4 border flex-row items-center justify-between"
      style={{
        bottom: Platform.OS === 'ios' ? 34 : 16,
        opacity,
        transform: [{ translateY }],
        backgroundColor: colors.secondary,
        borderColor: colors.secondary,
      }}
    >
      {/* Left text */}
      <Text className="text-[15px] font-bold" style={{ color: colors.primaryDark ?? '#fff' }}>
        {message}
      </Text>

      {/* Right collections arrow */}
      <Pressable onPress={onPressCollections} hitSlop={10} className="flex-row items-center">
        <Text
          className="mr-1 text-[16px] font-semibold underline"
          style={{ color: colors.primaryDark ?? '#fff' }}
        >
          Collections
        </Text>
        <Ionicons name="chevron-forward" size={20} color={colors.primaryDark ?? '#fff'} />
      </Pressable>
    </Animated.View>
  );
}
