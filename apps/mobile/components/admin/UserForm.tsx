import React from 'react';
import { View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import AppText from '../UI/textWrapper';
import AppTextInput from '../UI/textInputWrapper';

interface UserFormProps {
  formData: {
    username: string;
    email: string;
    password: string;
  };
  onFormChange: (field: string, value: string) => void;
  onSubmit: () => void;
  submitting: boolean;
  isEdit?: boolean;
}

export default function UserForm({
  formData,
  onFormChange,
  onSubmit,
  submitting,
  isEdit = false,
}: Readonly<UserFormProps>) {
  const { colors } = useTheme();

  return (
    <View className="bg-white/10 rounded-3xl p-5">
      <AppText className="text-white text-lg font-semibold mb-3">
        {isEdit ? 'Edit User' : 'Add a new user'}
      </AppText>

      <AppTextInput
        className="rounded-2xl px-4 py-3 mb-3 text-base"
        placeholder="Username *"
        placeholderTextColor="#d9d9d9"
        value={formData.username}
        onChangeText={(text) => onFormChange('username', text)}
        editable={!submitting}
        autoCapitalize="none"
        style={{ backgroundColor: '#ffffff' }}
      />

      <AppTextInput
        className="rounded-2xl px-4 py-3 mb-3 text-base"
        placeholder="Email *"
        placeholderTextColor="#d9d9d9"
        value={formData.email}
        onChangeText={(text) => onFormChange('email', text)}
        editable={!submitting}
        autoCapitalize="none"
        keyboardType="email-address"
        style={{ backgroundColor: '#ffffff' }}
      />

      <AppTextInput
        className="rounded-2xl px-4 py-3 mb-4 text-base"
        placeholder={isEdit ? 'Password (leave empty to keep current)' : 'Password *'}
        placeholderTextColor="#d9d9d9"
        value={formData.password}
        onChangeText={(text) => onFormChange('password', text)}
        secureTextEntry
        editable={!submitting}
        autoCapitalize="none"
        style={{ backgroundColor: '#ffffff' }}
      />

      <TouchableOpacity
        accessibilityRole="button"
        className="rounded-full py-3"
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
            {isEdit ? 'Update User' : 'Add User'}
          </AppText>
        )}
      </TouchableOpacity>
    </View>
  );
}
