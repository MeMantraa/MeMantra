import React from 'react';
import { TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
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
}

export default function MantraForm({
  formData,
  onFormChange,
  onSubmit,
  submitting,
  isEdit = false,
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
