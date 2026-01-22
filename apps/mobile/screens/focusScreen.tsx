import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MantraCarousel from '../components/carousel';
import { Mantra } from '../services/mantra.service';
import { useTheme } from '../context/ThemeContext';

export default function FocusScreen({ route, navigation }: any) {
  const { mantra, onLike, onSave } = route.params as {
    mantra: Mantra;
    onLike: (id: number) => void;
    onSave: (id: number) => void;
  };

  const { colors } = useTheme();

  return (
    <View className="flex-1" style={{ backgroundColor: colors.primary }}>
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        className="absolute z-20 p-2"
        style={{ top: 60, left: 20 }}
        testID="back-button"
        accessibilityRole="button"
      >
        <Ionicons name="chevron-back" size={32} color={colors.text} />
      </TouchableOpacity>

      <MantraCarousel
        item={mantra}
        onLike={onLike}
        onSave={onSave}
        showButtons={false}
        isFocusMode={true}
      />
    </View>
  );
}
