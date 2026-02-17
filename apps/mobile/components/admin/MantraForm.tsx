import React, { useMemo, useState } from 'react';
import { View, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { Category } from '../../services/category.service';
import AppText from '../UI/textWrapper';
import AppTextInput from '../UI/textInputWrapper';

interface MantraFormProps {
  formData: {
    title: string;
    key_takeaway: string;
    background_author?: string;
    background_description?: string;
    jamie_take?: string;
    when_where?: string;
    negative_thoughts?: string;
    cbt_principles?: string;
    references?: string;
  };
  onFormChange: (field: string, value: string) => void;
  onSubmit: () => void;
  submitting: boolean;
  isEdit?: boolean;
  categories?: Category[];
  selectedCategoryIds?: number[];
  onToggleCategory?: (categoryId: number) => void;
}

const TYPE_ORDER = ['essential', 'goal', 'mood', 'scenario', 'time', 'theme'] as const;
const TYPE_LABELS: Record<string, string> = {
  essential: 'Essentials',
  goal: 'Goals',
  mood: 'Moods',
  scenario: 'Life Scenarios',
  time: 'Times of Day / Year',
  theme: 'Values / Themes',
};

const TYPE_COLORS: Record<string, string> = {
  essential: '#8B5CF6',
  goal: '#3B82F6',
  mood: '#EC4899',
  scenario: '#10B981',
  time: '#F59E0B',
  theme: '#6366F1',
};

/* ─── Category Selector sub-component (grouped by layer) ─── */
function CategorySelector({
  categories,
  selectedCategoryIds,
  onToggleCategory,
  submitting,
}: Readonly<{
  categories: Category[];
  selectedCategoryIds: number[];
  onToggleCategory: (id: number) => void;
  submitting: boolean;
}>) {
  const [expandedLayers, setExpandedLayers] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(TYPE_ORDER.map((t) => [t, true])),
  );

  const grouped = useMemo(() => {
    const map: Record<string, Category[]> = {};
    for (const cat of categories) {
      const type = cat.category_type || 'essential';
      if (!map[type]) map[type] = [];
      map[type].push(cat);
    }

    return map;
  }, [categories]);

  const toggleLayer = (layer: string) =>
    setExpandedLayers((prev) => ({ ...prev, [layer]: !prev[layer] }));

  const totalSelected = selectedCategoryIds.length;

  return (
    <View className="mb-4">
      <AppText className="text-white text-sm font-semibold mb-2">
        Categories{totalSelected > 0 ? ` (${totalSelected} selected)` : ''}
      </AppText>

      {TYPE_ORDER.map((layer) => {
        const items = grouped[layer];
        if (!items || items.length === 0) return null;
        const expanded = expandedLayers[layer];
        const layerSelectedCount = items.filter((c) =>
          selectedCategoryIds.includes(c.category_id),
        ).length;

        return (
          <View key={layer} className="mb-3">
            {/* Section header */}
            <TouchableOpacity
              className="flex-row items-center justify-between rounded-xl px-3 py-2"
              style={{ backgroundColor: `${TYPE_COLORS[layer]}22` }}
              onPress={() => toggleLayer(layer)}
            >
              <View className="flex-row items-center gap-2">
                <View
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: TYPE_COLORS[layer] }}
                />
                <AppText className="text-white text-sm font-semibold">{TYPE_LABELS[layer]}</AppText>
              </View>
              <View className="flex-row items-center gap-2">
                {layerSelectedCount > 0 && (
                  <View
                    className="rounded-full px-2 py-0.5"
                    style={{ backgroundColor: TYPE_COLORS[layer] }}
                  >
                    <AppText className="text-white text-xs font-bold">{layerSelectedCount}</AppText>
                  </View>
                )}
                <AppText className="text-white/60 text-xs">{expanded ? '▲' : '▼'}</AppText>
              </View>
            </TouchableOpacity>

            {/* Chips */}
            {expanded && (
              <View className="flex-row flex-wrap gap-2 mt-2 ml-1">
                {items.map((cat) => {
                  const isSelected = selectedCategoryIds.includes(cat.category_id);
                  return (
                    <TouchableOpacity
                      key={cat.category_id}
                      className="rounded-full px-3 py-1.5"
                      style={{
                        backgroundColor: isSelected
                          ? TYPE_COLORS[layer]
                          : `${TYPE_COLORS[layer]}20`,
                      }}
                      onPress={() => onToggleCategory(cat.category_id)}
                      disabled={submitting}
                    >
                      <AppText className="text-xs font-semibold" style={{ color: '#ffffff' }}>
                        {cat.name}
                      </AppText>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}

export default function MantraForm({
  formData,
  onFormChange,
  onSubmit,
  submitting,
  isEdit = false,
  categories = [],
  selectedCategoryIds = [],
  onToggleCategory,
}: Readonly<MantraFormProps>) {
  const { colors } = useTheme();

  return (
    <ScrollView className="flex-1 bg-white/10 rounded-3xl p-5" showsVerticalScrollIndicator={false}>
      <AppText className="text-white text-lg font-semibold mb-3">
        {isEdit ? 'Edit Mantra' : 'Add a new mantra'}
      </AppText>

      <AppTextInput
        className="rounded-2xl px-4 py-3 mb-3 text-base"
        placeholder="Title *"
        placeholderTextColor="#d9d9d9"
        value={formData.title}
        onChangeText={(text) => onFormChange('title', text)}
        editable={!submitting}
        style={{ backgroundColor: '#ffffff' }}
      />

      <AppTextInput
        className="rounded-2xl px-4 py-3 mb-3 text-base"
        placeholder="Key Takeaway *"
        placeholderTextColor="#d9d9d9"
        value={formData.key_takeaway}
        onChangeText={(text) => onFormChange('key_takeaway', text)}
        multiline
        numberOfLines={4}
        editable={!submitting}
        style={{ backgroundColor: '#ffffff', minHeight: 100, textAlignVertical: 'top' }}
      />

      <AppTextInput
        className="rounded-2xl px-4 py-3 mb-3 text-base"
        placeholder="Background Author"
        placeholderTextColor="#d9d9d9"
        value={formData.background_author}
        onChangeText={(text) => onFormChange('background_author', text)}
        editable={!submitting}
        style={{ backgroundColor: '#ffffff' }}
      />

      <AppTextInput
        className="rounded-2xl px-4 py-3 mb-3 text-base"
        placeholder="Background Description"
        placeholderTextColor="#d9d9d9"
        value={formData.background_description}
        onChangeText={(text) => onFormChange('background_description', text)}
        multiline
        numberOfLines={4}
        editable={!submitting}
        style={{ backgroundColor: '#ffffff', minHeight: 100, textAlignVertical: 'top' }}
      />

      <AppTextInput
        className="rounded-2xl px-4 py-3 mb-3 text-base"
        placeholder="Jamie's Take"
        placeholderTextColor="#d9d9d9"
        value={formData.jamie_take}
        onChangeText={(text) => onFormChange('jamie_take', text)}
        multiline
        numberOfLines={6}
        editable={!submitting}
        style={{ backgroundColor: '#ffffff', minHeight: 150, textAlignVertical: 'top' }}
      />

      <AppTextInput
        className="rounded-2xl px-4 py-3 mb-3 text-base"
        placeholder="When & Where"
        placeholderTextColor="#d9d9d9"
        value={formData.when_where}
        onChangeText={(text) => onFormChange('when_where', text)}
        multiline
        numberOfLines={4}
        editable={!submitting}
        style={{ backgroundColor: '#ffffff', minHeight: 100, textAlignVertical: 'top' }}
      />

      <AppTextInput
        className="rounded-2xl px-4 py-3 mb-3 text-base"
        placeholder="Negative Thoughts It Replaces"
        placeholderTextColor="#d9d9d9"
        value={formData.negative_thoughts}
        onChangeText={(text) => onFormChange('negative_thoughts', text)}
        multiline
        numberOfLines={4}
        editable={!submitting}
        style={{ backgroundColor: '#ffffff', minHeight: 100, textAlignVertical: 'top' }}
      />

      <AppTextInput
        className="rounded-2xl px-4 py-3 mb-3 text-base"
        placeholder="CBT Principles"
        placeholderTextColor="#d9d9d9"
        value={formData.cbt_principles}
        onChangeText={(text) => onFormChange('cbt_principles', text)}
        multiline
        numberOfLines={6}
        editable={!submitting}
        style={{ backgroundColor: '#ffffff', minHeight: 150, textAlignVertical: 'top' }}
      />

      <AppTextInput
        className="rounded-2xl px-4 py-3 mb-4 text-base"
        placeholder="References"
        placeholderTextColor="#d9d9d9"
        value={formData.references}
        onChangeText={(text) => onFormChange('references', text)}
        multiline
        numberOfLines={4}
        editable={!submitting}
        style={{ backgroundColor: '#ffffff', minHeight: 100, textAlignVertical: 'top' }}
      />

      {/* Category Selection — grouped by layer */}
      {categories.length > 0 && onToggleCategory && (
        <CategorySelector
          categories={categories}
          selectedCategoryIds={selectedCategoryIds}
          onToggleCategory={onToggleCategory}
          submitting={submitting}
        />
      )}

      <TouchableOpacity
        accessibilityRole="button"
        className="rounded-full py-3 mb-4"
        style={{ backgroundColor: colors.secondary }}
        onPress={onSubmit}
        disabled={submitting}
      >
        {submitting ? (
          <ActivityIndicator color={colors.primaryDark} />
        ) : (
          <AppText
            className="text-center text-lg font-semibold"
            style={{ color: colors.primaryDark }}
          >
            {isEdit ? 'Update Mantra' : 'Add Mantra'}
          </AppText>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}
