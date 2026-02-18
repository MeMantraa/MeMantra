import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  SectionList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import AppText from '../components/UI/textWrapper';
import { storage } from '../utils/storage';
import { algorithmService, CategoryScore } from '../services/algorithm.service';

// ─── Category type → colour mapping ────────────────────────
const TYPE_COLORS: Record<string, string> = {
  essential: '#5E8C61',
  goal: '#C4A35A',
  mood: '#7B8EBF',
  scenario: '#B07BAC',
  time: '#D18E6E',
  theme: '#6AAFB8',
};

const TYPE_LABELS: Record<string, string> = {
  essential: 'Essential',
  goal: 'Goal',
  mood: 'Mood',
  scenario: 'Scenario',
  time: 'Time of Day',
  theme: 'Theme',
};

const TYPE_DESCRIPTIONS: Record<string, string> = {
  essential: 'High-level core areas for general exploration',
  goal: 'Users select a specific outcome or goal',
  mood: 'Match mantras to your current emotional state',
  scenario: 'Situational contexts where mantras are helpful',
  time: 'Timing-based mantras for routines or seasonal inspiration',
  theme: 'Aspirational, principle-driven mantras',
};

// Ordered list of section keys so sections always appear in this order
const SECTION_ORDER = ['essential', 'goal', 'mood', 'scenario', 'time', 'theme'];

export default function MantraAlgorithmScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation();

  const [scores, setScores] = useState<CategoryScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');

  // ─── Fetch scores ──────────────────────────────────────────
  const fetchScores = useCallback(async () => {
    try {
      const token = await storage.getToken();
      if (!token) return;
      const res = await algorithmService.getScores(token);
      if (res.status === 'success') {
        setScores(res.data.scores);
      }
    } catch (err) {
      console.error('Failed to load algorithm scores', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchScores();
  }, [fetchScores]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchScores();
  };

  // ─── Update a score ────────────────────────────────────────
  const handleSaveScore = async (categoryId: number) => {
    const newScore = parseInt(editValue, 10);
    if (isNaN(newScore) || newScore < 0) {
      Alert.alert('Invalid score', 'Please enter a non-negative number.');
      return;
    }
    try {
      const token = await storage.getToken();
      if (!token) return;
      await algorithmService.updateScore(token, categoryId, newScore);
      setScores((prev) =>
        prev.map((s) => (s.category_id === categoryId ? { ...s, score: newScore } : s)),
      );
      setEditingId(null);
    } catch (err) {
      console.error('Error updating score', err);
      Alert.alert('Error', 'Could not update score.');
    }
  };

  const performResetScore = async (categoryId: number) => {
    try {
      const token = await storage.getToken();
      if (!token) return;
      await algorithmService.resetScore(token, categoryId);
      setScores((prev) => prev.filter((s) => s.category_id !== categoryId));
    } catch (err) {
      console.error('Error resetting score', err);
    }
  };

  const performResetAll = async () => {
    try {
      const token = await storage.getToken();
      if (!token) return;
      await algorithmService.resetAllScores(token);
      setScores([]);
    } catch (err) {
      console.error('Error resetting all scores', err);
    }
  };

  // ─── Reset a single score ─────────────────────────────────
  const handleResetScore = (categoryId: number, name: string) => {
    Alert.alert('Reset category', `Reset "${name}" to 0?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset',
        style: 'destructive',
        onPress: () => performResetScore(categoryId),
      },
    ]);
  };

  // ─── Reset all ─────────────────────────────────────────────
  const handleResetAll = () => {
    Alert.alert(
      'Reset entire algorithm',
      'This will remove all your category preferences. Your feed will start fresh. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset All',
          style: 'destructive',
          onPress: () => performResetAll(),
        },
      ],
    );
  };

  // ─── Filter out zero-score categories & build sections ─────
  const activeScores = useMemo(() => scores.filter((s) => s.score > 0), [scores]);

  const sections = useMemo(() => {
    const grouped: Record<string, CategoryScore[]> = {};
    for (const s of activeScores) {
      const key = s.category_type || 'other';
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(s);
    }
    // Sort each group by score descending
    for (const key of Object.keys(grouped)) {
      grouped[key].sort((a, b) => b.score - a.score);
    }
    // Return sections in defined order, skipping empty ones
    return SECTION_ORDER.filter((key) => grouped[key] && grouped[key].length > 0).map((key) => ({
      type: key,
      title: TYPE_LABELS[key] || key,
      description: TYPE_DESCRIPTIONS[key] || '',
      color: TYPE_COLORS[key] || '#888888',
      data: grouped[key],
    }));
  }, [activeScores]);

  // ─── Compute max score for bar width ───────────────────────
  const maxScore = activeScores.length > 0 ? Math.max(...activeScores.map((s) => s.score), 1) : 1;

  // ─── Render a single category row ─────────────────────────
  const renderCategory = ({ item }: { item: CategoryScore }) => {
    const barColor = TYPE_COLORS[item.category_type || ''] || colors.primaryDark;
    const barWidthPercent = Math.round((item.score / maxScore) * 100);
    const isEditing = editingId === item.category_id;

    return (
      <View
        style={{
          backgroundColor: 'rgba(255,255,255,0.12)',
          borderRadius: 14,
          padding: 14,
          marginBottom: 10,
        }}
      >
        {/* Header row */}
        <View
          style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
        >
          <View style={{ flex: 1, marginRight: 8 }}>
            <AppText style={{ color: colors.text, fontSize: 15 }} numberOfLines={1}>
              {item.name}
            </AppText>
          </View>

          {/* Score display / edit */}
          {isEditing ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <TextInput
                style={{
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  color: colors.text,
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: 8,
                  width: 60,
                  textAlign: 'center',
                  fontSize: 15,
                  fontFamily: 'LibreBaskerville-Regular',
                }}
                value={editValue}
                onChangeText={setEditValue}
                keyboardType="numeric"
                autoFocus
              />
              <TouchableOpacity onPress={() => handleSaveScore(item.category_id)}>
                <Ionicons name="checkmark-circle" size={26} color="#8BC34A" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setEditingId(null)}>
                <Ionicons name="close-circle" size={26} color="rgba(255,255,255,0.5)" />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <AppText style={{ color: colors.text, fontSize: 17, fontWeight: '700' }}>
                {item.score}
              </AppText>
              <TouchableOpacity
                onPress={() => {
                  setEditingId(item.category_id);
                  setEditValue(String(item.score));
                }}
              >
                <Ionicons name="pencil" size={18} color="rgba(255,255,255,0.6)" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleResetScore(item.category_id, item.name)}>
                <Ionicons name="trash-outline" size={18} color="rgba(255,255,255,0.4)" />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Score bar */}
        <View
          style={{
            height: 8,
            backgroundColor: 'rgba(255,255,255,0.1)',
            borderRadius: 4,
            marginTop: 10,
            overflow: 'hidden',
          }}
        >
          <View
            style={{
              height: '100%',
              width: `${barWidthPercent}%` as any,
              backgroundColor: barColor,
              borderRadius: 4,
            }}
          />
        </View>
      </View>
    );
  };

  // ─── Section header ─────────────────────────────────────────
  const renderSectionHeader = ({
    section,
  }: {
    section: { type: string; title: string; description: string; color: string };
  }) => (
    <View style={{ marginTop: 20, marginBottom: 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: section.color }} />
        <AppText style={{ color: colors.text, fontSize: 18, fontWeight: '600' }}>
          {section.title}
        </AppText>
      </View>
      <AppText style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12, marginLeft: 20 }}>
        {section.description}
      </AppText>
    </View>
  );

  // ─── Header component ──────────────────────────────────────
  const ListHeader = () => (
    <View style={{ marginBottom: 4 }}>
      <AppText
        style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, lineHeight: 19, marginBottom: 14 }}
      >
        Your feed is personalised based on these scores. Categories with higher scores appear more
        often. Categories at zero are hidden automatically. Tap the pencil to edit a score, or the
        trash icon to reset one.
      </AppText>

      {activeScores.length > 0 && (
        <TouchableOpacity
          onPress={handleResetAll}
          style={{
            alignSelf: 'flex-end',
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: 'rgba(228, 68, 56, 0.2)',
            paddingHorizontal: 14,
            paddingVertical: 8,
            borderRadius: 10,
            gap: 6,
          }}
        >
          <Ionicons name="refresh" size={16} color={colors.error || '#E44438'} />
          <AppText style={{ color: colors.error || '#E44438', fontSize: 13 }}>Reset All</AppText>
        </TouchableOpacity>
      )}
    </View>
  );

  // ─── Empty state ───────────────────────────────────────────
  const EmptyState = () => (
    <View style={{ alignItems: 'center', marginTop: 60, paddingHorizontal: 24 }}>
      <Ionicons name="analytics-outline" size={64} color="rgba(255,255,255,0.3)" />
      <AppText
        style={{
          color: 'rgba(255,255,255,0.6)',
          fontSize: 15,
          textAlign: 'center',
          marginTop: 16,
          lineHeight: 22,
        }}
      >
        No algorithm data yet. Like, save, rate, or journal about mantras to start building your
        personalised feed.
      </AppText>
    </View>
  );

  // ─── Main render ───────────────────────────────────────────
  return (
    <View style={{ flex: 1, backgroundColor: colors.primary }}>
      {/* Top bar */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingTop: 56,
          paddingHorizontal: 20,
          paddingBottom: 14,
        }}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 14 }}>
          <Ionicons name="chevron-back" size={28} color={colors.text} />
        </TouchableOpacity>
        <AppText style={{ color: colors.text, fontSize: 22 }}>Mantra Algorithm</AppText>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.text} style={{ marginTop: 60 }} />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => String(item.category_id)}
          renderItem={renderCategory}
          renderSectionHeader={renderSectionHeader}
          ListHeaderComponent={<ListHeader />}
          ListEmptyComponent={<EmptyState />}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
          stickySectionHeadersEnabled={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.text} />
          }
        />
      )}
    </View>
  );
}
