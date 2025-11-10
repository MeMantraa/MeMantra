import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import {
  CreateMantraPayload,
  Mantra,
  MantraDetailResponse,
  MantraMutationResponse,
  mantraService,
} from '../services/mantra.service';
import { storage } from '../utils/storage';

const ADD_MODE: AdminMode = 'add';
const DELETE_MODE: AdminMode = 'delete';

const mockTokenFallback = 'mock-token';

type AdminMode = 'add' | 'delete';

const AdminScreen: React.FC = () => {
  const { colors } = useTheme();
  const [mode, setMode] = useState<AdminMode>(ADD_MODE);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [mantras, setMantras] = useState<Mantra[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchMantras = async () => {
      setLoading(true);
      try {
        const token = (await storage.getToken()) || mockTokenFallback;
        const response = await mantraService.getFeedMantras(token);
        if (response.status === 'success' && isMounted) {
          setMantras(response.data);
        } else if (isMounted) {
          Alert.alert('Error', response.message || 'Unable to load mantras.');
        }
      } catch (error) {
        console.error('Failed to load mantras', error);
        if (isMounted) {
          Alert.alert('Error', 'Failed to load mantras. Please try again.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchMantras();

    return () => {
      isMounted = false;
    };
  }, []);

  const resetForm = useCallback(() => {
    setTitle('');
    setDescription('');
  }, []);

  const handleCreateMantra = useCallback(async () => {
    const trimmedTitle = title.trim();
    const trimmedDescription = description.trim();

    if (!trimmedTitle || !trimmedDescription) {
      Alert.alert('Missing information', 'Please provide both a title and description.');
      return;
    }

    setSubmitting(true);
    try {
      const token = (await storage.getToken()) || mockTokenFallback;
      const payload: CreateMantraPayload = {
        title: trimmedTitle,
        key_takeaway: trimmedDescription,
      };

      const response = (await mantraService.createMantra(payload, token)) as MantraDetailResponse;

      if (response.status === 'success') {
        const newMantra = response.data.mantra;
        setMantras((prev) => [newMantra, ...prev]);
        resetForm();
        Alert.alert('Success', 'Mantra added successfully.');
      } else {
        Alert.alert('Error', response.message || 'Failed to add mantra.');
      }
    } catch (error) {
      console.error('Failed to create mantra', error);
      Alert.alert('Error', 'Failed to add mantra. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }, [description, resetForm, title]);

  const handleDeleteMantra = useCallback(
    async (mantraId: number) => {
      setDeletingId(mantraId);
      try {
        const token = (await storage.getToken()) || mockTokenFallback;
        const response = (await mantraService.deleteMantra(mantraId, token)) as MantraMutationResponse;

        if (response.status === 'success') {
          setMantras((prev) => prev.filter((mantra) => mantra.mantra_id !== mantraId));
          Alert.alert('Deleted', 'Mantra deleted successfully.');
        } else {
          Alert.alert('Error', response.message || 'Failed to delete mantra.');
        }
      } catch (error) {
        console.error('Failed to delete mantra', error);
        Alert.alert('Error', 'Failed to delete mantra. Please try again.');
      } finally {
        setDeletingId(null);
      }
    },
    [],
  );

  const confirmDelete = useCallback(
    (mantraId: number, mantraTitle: string) => {
      Alert.alert(
        'Delete Mantra',
        `Are you sure you want to delete "${mantraTitle}"?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: () => void handleDeleteMantra(mantraId) },
        ],
        { cancelable: true },
      );
    },
    [handleDeleteMantra],
  );

  const renderMantraItem = useCallback(
    ({ item }: { item: Mantra }) => (
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
        <TouchableOpacity
          accessibilityRole="button"
          className="rounded-full px-4 py-2"
          style={{ backgroundColor: colors.secondary }}
          onPress={() => confirmDelete(item.mantra_id, item.title)}
          disabled={deletingId === item.mantra_id}
        >
          {deletingId === item.mantra_id ? (
            <ActivityIndicator color={colors.primaryDark} />
          ) : (
            <Text className="text-base font-semibold" style={{ color: colors.primaryDark }}>
              Delete
            </Text>
          )}
        </TouchableOpacity>
      </View>
    ),
    [colors.primaryDark, colors.secondary, confirmDelete, deletingId],
  );

  const emptyListComponent = useMemo(
    () => (
      <View className="flex-1 items-center justify-center py-16">
        <Text className="text-white/80 text-base text-center">No mantras available.</Text>
      </View>
    ),
    [],
  );

  const modeButtons = useMemo(
    () => (
      <View
        className="flex-row p-1 rounded-full"
        style={{ backgroundColor: `${colors.primaryDark}55` }}
      >
        <TouchableOpacity
          className="flex-1 rounded-full px-4 py-3"
          accessibilityRole="button"
          onPress={() => setMode(ADD_MODE)}
          style={{ backgroundColor: mode === ADD_MODE ? colors.secondary : 'transparent' }}
        >
          <Text
            className="text-center font-semibold"
            style={{ color: mode === ADD_MODE ? colors.primaryDark : colors.text }}
          >
            Add
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="flex-1 rounded-full px-4 py-3"
          accessibilityRole="button"
          onPress={() => setMode(DELETE_MODE)}
          style={{ backgroundColor: mode === DELETE_MODE ? colors.secondary : 'transparent' }}
        >
          <Text
            className="text-center font-semibold"
            style={{ color: mode === DELETE_MODE ? colors.primaryDark : colors.text }}
          >
            Delete
          </Text>
        </TouchableOpacity>
      </View>
    ),
    [colors.primaryDark, colors.secondary, colors.text, mode],
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1 }}
    >
      <View className="flex-1 px-6 pt-16 pb-6" style={{ backgroundColor: colors.primary }}>
        <Text className="text-white text-3xl font-bold mb-6">Admin Controls</Text>
        {modeButtons}

        {mode === ADD_MODE ? (
          <View className="mt-6 bg-white/10 rounded-3xl p-5">
            <Text className="text-white text-lg font-semibold mb-3">Add a new mantra</Text>
            <TextInput
              className="rounded-2xl px-4 py-3 mb-3 text-base"
              placeholder="Mantra title"
              placeholderTextColor="#d9d9d9"
              value={title}
              onChangeText={setTitle}
              editable={!submitting}
              style={{ backgroundColor: '#ffffff' }}
            />
            <TextInput
              className="rounded-2xl px-4 py-3 mb-4 text-base"
              placeholder="Description"
              placeholderTextColor="#d9d9d9"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              editable={!submitting}
              style={{ backgroundColor: '#ffffff', minHeight: 120, textAlignVertical: 'top' }}
            />
            <TouchableOpacity
              accessibilityRole="button"
              className="rounded-full py-3"
              style={{ backgroundColor: colors.secondary }}
              onPress={handleCreateMantra}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color={colors.primaryDark} />
              ) : (
                <Text className="text-center text-lg font-semibold" style={{ color: colors.primaryDark }}>
                  Add Mantra
                </Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <View className="flex-1 mt-6">
            {loading ? (
              <View className="flex-1 items-center justify-center">
                <ActivityIndicator color={colors.secondary} />
                <Text className="text-white/80 mt-3">Loading mantras...</Text>
              </View>
            ) : (
              <FlatList
                data={mantras}
                keyExtractor={(item) => item.mantra_id.toString()}
                renderItem={renderMantraItem}
                contentContainerStyle={{ paddingTop: 4, paddingBottom: 24 }}
                ListEmptyComponent={emptyListComponent}
              />
            )}
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

export default AdminScreen;
