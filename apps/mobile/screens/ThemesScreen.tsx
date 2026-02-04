// screens/ThemesScreen.tsx
import React from 'react';
import { View, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { themes, ThemeName, themeDisplayNames } from '../styles/theme';
import AppText from '../components/UI/textWrapper';
import { Ionicons } from '@expo/vector-icons';

export default function ThemesScreen() {
  const { colors, theme: currentTheme, setTheme } = useTheme();
  const navigation = useNavigation();

  const themeOptions = Object.keys(themes) as ThemeName[];

  return (
    <View className="flex-1 pt-16 px-6" style={{ backgroundColor: colors.primary }}>
      <View className="flex-row items-center mb-6">
        <TouchableOpacity onPress={() => navigation.goBack()} className="mr-4">
          <Ionicons name="arrow-back" size={28} color={colors.text} />
        </TouchableOpacity>
        <AppText className="text-[28px]" style={{ color: colors.text }}>
          Themes
        </AppText>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <AppText className="text-[14px] mb-4 opacity-80" style={{ color: colors.text }}>
          Choose your preferred color theme
        </AppText>

        <View className="gap-3">
          {themeOptions.map((themeName) => {
            const themeColors = themes[themeName];
            const isSelected = currentTheme === themeName;

            return (
              <TouchableOpacity
                key={themeName}
                onPress={() => setTheme(themeName)}
                className="rounded-2xl p-4 flex-row items-center justify-between"
                style={{
                  backgroundColor: colors.primaryDark,
                  borderWidth: isSelected ? 2 : 0,
                  borderColor: colors.secondary,
                }}
              >
                <View className="flex-row items-center flex-1">
                  {/* Color Preview */}
                  <View className="flex-row mr-4">
                    <View
                      className="w-10 h-10 rounded-l-lg"
                      style={{ backgroundColor: themeColors.primary }}
                    />
                    <View
                      className="w-10 h-10 rounded-r-lg"
                      style={{ backgroundColor: themeColors.secondary }}
                    />
                  </View>

                  {/* Theme Name */}
                  <AppText className="text-[16px] flex-1" style={{ color: colors.text }}>
                    {themeDisplayNames[themeName]}
                  </AppText>
                </View>

                {/* Checkmark if selected */}
                {isSelected && (
                  <Ionicons name="checkmark-circle" size={24} color={colors.secondary} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}
