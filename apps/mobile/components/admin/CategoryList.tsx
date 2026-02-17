import React from 'react';
import { View, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { Category } from '../../services/category.service';
import AppText from '../UI/textWrapper';

interface CategoryListProps {
  categories: Category[];
  loading: boolean;
  deletingId: number | null;
  onEdit: (category: Category) => void;
  onDelete: (categoryId: number, name: string) => void;
}

const TYPE_COLORS: Record<string, string> = {
  essential: '#8B5CF6', // purple
  goal: '#3B82F6', // blue
  mood: '#EC4899', // pink
  scenario: '#10B981', // green
  time: '#F59E0B', // amber
  theme: '#6366F1', // indigo
};

const TYPE_LABELS: Record<string, string> = {
  essential: 'Essential',
  goal: 'Goal',
  mood: 'Mood',
  scenario: 'Scenario',
  time: 'Time',
  theme: 'Theme',
};

export default function CategoryList({
  categories,
  loading,
  deletingId,
  onEdit,
  onDelete,
}: Readonly<CategoryListProps>) {
  const { colors } = useTheme();

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator color={colors.secondary} />
        <AppText className="text-white/80 mt-3">Loading categories...</AppText>
      </View>
    );
  }

  if (categories.length === 0) {
    return (
      <View className="flex-1 items-center justify-center py-16">
        <AppText className="text-white/80 text-base text-center">No categories available.</AppText>
      </View>
    );
  }

  return (
    <FlatList
      data={categories}
      keyExtractor={(item) => item.category_id.toString()}
      contentContainerStyle={{ paddingTop: 4, paddingBottom: 24 }}
      renderItem={({ item }) => (
        <View
          className="rounded-3xl p-4 mb-3"
          style={{ backgroundColor: `${colors.primaryDark}33` }}
        >
          {/* Top row: badges */}
          <View className="flex-row items-center gap-2 mb-1">
            {item.category_type ? (
              <View
                className="rounded-full px-2 py-0.5"
                style={{
                  backgroundColor: TYPE_COLORS[item.category_type] || '#6B7280',
                }}
              >
                <AppText className="text-white text-xs font-medium">
                  {TYPE_LABELS[item.category_type] || item.category_type}
                </AppText>
              </View>
            ) : null}
            {item.parent_id ? (
              <View className="rounded-full px-2 py-0.5" style={{ backgroundColor: '#6B728066' }}>
                <AppText className="text-white text-xs font-medium">Sub</AppText>
              </View>
            ) : null}
          </View>

          {/* Name */}
          <AppText className="text-white text-lg font-semibold" numberOfLines={2}>
            {item.name}
          </AppText>

          {/* Description */}
          {item.description ? (
            <AppText className="text-white/80 text-sm mt-1" numberOfLines={2}>
              {item.description}
            </AppText>
          ) : null}

          {/* Action buttons */}
          <View className="flex-row gap-2 mt-3">
            <TouchableOpacity
              accessibilityRole="button"
              className="rounded-full px-4 py-2"
              style={{ backgroundColor: colors.secondary }}
              onPress={() => onEdit(item)}
            >
              <AppText className="text-base font-semibold" style={{ color: colors.primaryDark }}>
                Edit
              </AppText>
            </TouchableOpacity>
            <TouchableOpacity
              accessibilityRole="button"
              className="rounded-full px-4 py-2"
              style={{ backgroundColor: '#EF4444' }}
              onPress={() => onDelete(item.category_id, item.name)}
              disabled={deletingId === item.category_id}
            >
              {deletingId === item.category_id ? (
                <ActivityIndicator color="white" />
              ) : (
                <AppText className="text-base font-semibold text-white">Delete</AppText>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}
    />
  );
}
