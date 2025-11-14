import React from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { Mantra } from '../../services/mantra.service';

interface MantraListProps {
  mantras: Mantra[];
  loading: boolean;
  deletingId: number | null;
  onEdit: (mantra: Mantra) => void;
  onDelete: (mantraId: number, title: string) => void;
}

export default function MantraList({
  mantras,
  loading,
  deletingId,
  onEdit,
  onDelete,
}: MantraListProps) {
  const { colors } = useTheme();

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator color={colors.secondary} />
        <Text className="text-white/80 mt-3">Loading mantras...</Text>
      </View>
    );
  }

  if (mantras.length === 0) {
    return (
      <View className="flex-1 items-center justify-center py-16">
        <Text className="text-white/80 text-base text-center">No mantras available.</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={mantras}
      keyExtractor={(item) => item.mantra_id.toString()}
      contentContainerStyle={{ paddingTop: 4, paddingBottom: 24 }}
      renderItem={({ item }) => (
        <View
          className="flex-row items-center rounded-3xl p-4 mb-3"
          style={{ backgroundColor: `${colors.primaryDark}33` }}
        >
          <View className="flex-1 pr-3">
            <Text className="text-white text-lg font-semibold" numberOfLines={1}>
              {item.title}
            </Text>
            {item.key_takeaway ? (
              <Text className="text-white/80 text-sm mt-1" numberOfLines={2}>
                {item.key_takeaway}
              </Text>
            ) : null}
          </View>
          <View className="flex-row gap-2">
            <TouchableOpacity
              accessibilityRole="button"
              className="rounded-full px-4 py-2"
              style={{ backgroundColor: colors.secondary }}
              onPress={() => onEdit(item)}
            >
              <Text className="text-base font-semibold" style={{ color: colors.primaryDark }}>
                Edit
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              accessibilityRole="button"
              className="rounded-full px-4 py-2"
              style={{ backgroundColor: '#EF4444' }}
              onPress={() => onDelete(item.mantra_id, item.title)}
              disabled={deletingId === item.mantra_id}
            >
              {deletingId === item.mantra_id ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-base font-semibold text-white">Delete</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}
    />
  );
}
