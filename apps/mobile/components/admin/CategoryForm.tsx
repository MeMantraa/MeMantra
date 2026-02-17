import React from 'react';
import { View, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { Category } from '../../services/category.service';
import AppText from '../UI/textWrapper';
import AppTextInput from '../UI/textInputWrapper';

const CATEGORY_TYPES = ['essential', 'goal', 'mood', 'scenario', 'time', 'theme'] as const;

const TYPE_LABELS: Record<string, string> = {
  essential: 'Essentials',
  goal: 'Goals',
  mood: 'Moods',
  scenario: 'Life Scenarios',
  time: 'Times',
  theme: 'Themes',
};

interface CategoryFormProps {
  formData: {
    name: string;
    description: string;
    category_type: string;
    image_url: string;
    parent_id: string;
  };
  onFormChange: (field: string, value: string) => void;
  onSubmit: () => void;
  submitting: boolean;
  isEdit?: boolean;
  categories?: Category[]; // all categories for parent picker
}

export default function CategoryForm({
  formData,
  onFormChange,
  onSubmit,
  submitting,
  isEdit = false,
  categories = [],
}: Readonly<CategoryFormProps>) {
  const { colors } = useTheme();

  const parentOptions = categories.filter(
    (c) => c.category_type === formData.category_type && !c.parent_id,
  );

  return (
    <ScrollView className="flex-1 bg-white/10 rounded-3xl p-5" showsVerticalScrollIndicator={false}>
      <AppText className="text-white text-lg font-semibold mb-3">
        {isEdit ? 'Edit Category' : 'Add a new category'}
      </AppText>

      <AppTextInput
        className="rounded-2xl px-4 py-3 mb-3 text-base"
        placeholder="Category Name *"
        placeholderTextColor="#d9d9d9"
        value={formData.name}
        onChangeText={(text: string) => onFormChange('name', text)}
        editable={!submitting}
        style={{ backgroundColor: '#ffffff' }}
      />

      <AppTextInput
        className="rounded-2xl px-4 py-3 mb-3 text-base"
        placeholder="Description"
        placeholderTextColor="#d9d9d9"
        value={formData.description}
        onChangeText={(text: string) => onFormChange('description', text)}
        multiline
        numberOfLines={4}
        editable={!submitting}
        style={{ backgroundColor: '#ffffff', minHeight: 100, textAlignVertical: 'top' }}
      />

      {/* Category Type Selector */}
      <AppText className="text-white text-sm font-semibold mb-2 mt-1">Category Layer</AppText>
      <View className="flex-row flex-wrap gap-2 mb-4">
        {CATEGORY_TYPES.map((type) => {
          const isSelected = formData.category_type === type;
          return (
            <TouchableOpacity
              key={type}
              className="rounded-full px-4 py-2"
              style={{
                backgroundColor: isSelected ? colors.secondary : `${colors.primaryDark}55`,
                borderWidth: isSelected ? 0 : 1,
                borderColor: 'rgba(255,255,255,0.2)',
              }}
              onPress={() => {
                onFormChange('category_type', isSelected ? '' : type);
                // Reset parent when changing type
                onFormChange('parent_id', '');
              }}
              disabled={submitting}
            >
              <AppText
                className="text-sm font-semibold"
                style={{ color: isSelected ? colors.primaryDark : '#ffffff' }}
              >
                {TYPE_LABELS[type] || type}
              </AppText>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Parent Category Selector (for subcategories only shown for 'essential' type) */}
      {formData.category_type === 'essential' && parentOptions.length > 0 && (
        <>
          <AppText className="text-white text-sm font-semibold mb-2">
            Parent Category (optional – leave empty for top-level)
          </AppText>
          <View className="flex-row flex-wrap gap-2 mb-4">
            {parentOptions.map((parent) => {
              const isSelected = formData.parent_id === String(parent.category_id);
              return (
                <TouchableOpacity
                  key={parent.category_id}
                  className="rounded-full px-3 py-1.5"
                  style={{
                    backgroundColor: isSelected ? '#8B5CF6' : `${colors.primaryDark}44`,
                    borderWidth: isSelected ? 0 : 1,
                    borderColor: 'rgba(255,255,255,0.15)',
                  }}
                  onPress={() =>
                    onFormChange('parent_id', isSelected ? '' : String(parent.category_id))
                  }
                  disabled={submitting}
                >
                  <AppText className="text-xs font-medium" style={{ color: '#ffffff' }}>
                    {parent.name}
                  </AppText>
                </TouchableOpacity>
              );
            })}
          </View>
        </>
      )}

      <AppTextInput
        className="rounded-2xl px-4 py-3 mb-4 text-base"
        placeholder="Image URL (optional)"
        placeholderTextColor="#d9d9d9"
        value={formData.image_url}
        onChangeText={(text: string) => onFormChange('image_url', text)}
        editable={!submitting}
        autoCapitalize="none"
        style={{ backgroundColor: '#ffffff' }}
      />

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
            {isEdit ? 'Update Category' : 'Add Category'}
          </AppText>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}
