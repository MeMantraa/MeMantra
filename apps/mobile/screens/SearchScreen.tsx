import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  View,
  FlatList,
  TouchableOpacity,
  TextInput,
  StatusBar,
  InteractionManager,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import AppText from '../components/UI/textWrapper';
import AppTextInput from '../components/UI/textInputWrapper';
import { Mantra } from '../services/mantra.service';

const SEARCHABLE_FIELDS: (keyof Mantra)[] = [
  'title',
  'key_takeaway',
  'background_author',
  'background_description',
  'jamie_take',
  'when_where',
  'negative_thoughts',
  'cbt_principles',
  'references',
];

export default function SearchScreen({ navigation, route }: any) {
  const { colors } = useTheme();
  const [query, setQuery] = useState('');
  const allMantras: Mantra[] = route?.params?.mantras ?? [];
  const inputRef = useRef<TextInput>(null);

  useFocusEffect(
    useCallback(() => {
      // Wait for the navigation transition to settle before focusing.
      const task = InteractionManager.runAfterInteractions(() => {
        inputRef.current?.focus();
      });

      return () => task.cancel();
    }, []),
  );

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return allMantras.filter((mantra) =>
      SEARCHABLE_FIELDS.some((field) => {
        const val = mantra[field];
        return typeof val === 'string' && val.toLowerCase().includes(q);
      }),
    );
  }, [query, allMantras]);

  const handleSelectMantra = useCallback(
    (mantra: Mantra) => {
      navigation.navigate('Focus', {
        mantra,
        onLike: () => {},
        onSave: () => {},
      });
    },
    [navigation],
  );

  const getSnippet = (
    mantra: Mantra,
    q: string,
  ): { before: string; match: string; after: string } | null => {
    for (const field of SEARCHABLE_FIELDS) {
      const val = mantra[field];
      if (typeof val !== 'string') continue;
      const idx = val.toLowerCase().indexOf(q.toLowerCase());
      if (idx === -1) continue;
      const match = val.slice(idx, idx + q.length);
      const beforeText = val.slice(0, idx);
      const afterText = val.slice(idx + q.length);

      // Slice raw text to preserve partial words; truncate at word boundaries
      const beforeSpaces = [...beforeText.matchAll(/\s+/g)];
      const before =
        beforeSpaces.length >= 3
          ? '...' +
            beforeText.slice((beforeSpaces.at(-3)!.index ?? 0) + beforeSpaces.at(-3)![0].length)
          : beforeText;

      const afterSpaces = [...afterText.matchAll(/\s+/g)];
      const after =
        afterSpaces.length >= 3
          ? afterText.slice(0, afterSpaces.at(2)?.index ?? afterText.length) + '...'
          : afterText;

      return { before, match, after };
    }
    return null;
  };

  const renderItem = ({ item }: { item: Mantra }) => {
    const snippet = getSnippet(item, query.trim());
    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => handleSelectMantra(item)}
        style={{
          paddingVertical: 16,
          paddingHorizontal: 20,
          borderBottomWidth: 1,
          borderBottomColor: colors.secondary + '40',
        }}
      >
        <AppText
          style={{
            color: colors.text,
            fontSize: 18,
            fontWeight: '700',
            lineHeight: 26,
          }}
        >
          {item.title}
        </AppText>
        {snippet && (
          <AppText
            numberOfLines={1}
            style={{ color: colors.text, fontSize: 13, opacity: 0.65, marginTop: 4 }}
          >
            {snippet.before}
            <AppText style={{ opacity: 1, fontWeight: '700', color: colors.text }}>
              {snippet.match}
            </AppText>
            {snippet.after}
          </AppText>
        )}
      </TouchableOpacity>
    );
  };

  const showEmpty = query.trim().length > 0 && results.length === 0;
  const showPlaceholder = query.trim().length === 0;

  const renderBody = () => {
    if (showPlaceholder) {
      return (
        <View
          style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 28 }}
        >
          <View
            style={{
              width: 96,
              height: 96,
              borderRadius: 48,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: colors.secondary + '22',
              borderWidth: 1,
              borderColor: colors.secondary + '55',
            }}
          >
            <Ionicons name="search-outline" size={44} color={colors.secondary} />
          </View>
          <AppText
            style={{
              color: colors.text,
              fontSize: 24,
              textAlign: 'center',
              marginTop: 24,
              fontWeight: '700',
            }}
          >
            Search all mantras
          </AppText>
          <AppText
            style={{
              color: colors.text,
              fontSize: 16,
              textAlign: 'center',
              marginTop: 10,
              opacity: 0.75,
              lineHeight: 24,
            }}
          >
            Type a keyword to find matching titles and content instantly.
          </AppText>
        </View>
      );
    }
    if (showEmpty) {
      return (
        <View
          style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 }}
        >
          <Ionicons name="file-tray-outline" size={56} color={colors.secondary} />
          <AppText
            style={{
              color: colors.text,
              fontSize: 16,
              textAlign: 'center',
              marginTop: 16,
            }}
          >
            No mantras found for <AppText style={{ fontWeight: '700' }}>"{query.trim()}"</AppText>
          </AppText>
        </View>
      );
    }
    return (
      <>
        <AppText
          style={{
            color: colors.text,
            fontSize: 13,
            opacity: 0.6,
            paddingHorizontal: 20,
            paddingTop: 12,
            paddingBottom: 4,
          }}
        >
          {results.length} result{results.length === 1 ? '' : 's'} for &quot;{query.trim()}&quot;
        </AppText>
        <FlatList
          data={results}
          keyExtractor={(item) => item.mantra_id.toString()}
          renderItem={renderItem}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        />
      </>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.primary }}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingTop: 54,
          paddingBottom: 12,
          paddingHorizontal: 16,
          backgroundColor: colors.primary,
          borderBottomWidth: 1,
          borderBottomColor: colors.secondary + '2a',
        }}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 10,
            backgroundColor: colors.secondary + '20',
          }}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>

        <View
          style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.secondary + 'f2',
            borderRadius: 28,
            paddingHorizontal: 14,
            height: 56,
            borderWidth: 1,
            borderColor: colors.secondary + 'd0',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.08,
            shadowRadius: 10,
            elevation: 2,
          }}
        >
          <View
            style={{
              width: 30,
              height: 30,
              borderRadius: 15,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: colors.primary + '22',
            }}
          >
            <Ionicons name="search-outline" size={18} color={colors.primaryDark} />
          </View>
          <AppTextInput
            ref={inputRef}
            value={query}
            onChangeText={setQuery}
            autoFocus
            placeholder="Search mantras..."
            placeholderTextColor={colors.primaryDark + '99'}
            selectionColor={colors.primaryDark}
            style={{
              flex: 1,
              marginLeft: 10,
              color: colors.primaryDark,
              fontSize: 17,
              backgroundColor: 'transparent',
              borderWidth: 0,
              borderColor: 'transparent',
              borderRadius: 0,
              paddingHorizontal: 0,
              padding: 0,
              paddingVertical: 0,
              height: 56,
            }}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
          />
          {query.length > 0 && (
            <TouchableOpacity
              onPress={() => setQuery('')}
              style={{
                width: 28,
                height: 28,
                borderRadius: 14,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: colors.primary + '22',
              }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close" size={16} color={colors.primaryDark} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Body */}
      {renderBody()}
    </View>
  );
}
