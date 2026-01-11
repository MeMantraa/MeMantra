import React, { useEffect, useState } from 'react';
import {
  View,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import AppText from '../components/UI/textWrapper';
import { Mantra } from '../services/mantra.service';
import { collectionService } from '../services/collection.service';
import { storage } from '../utils/storage';

const SCREEN_WIDTH = Dimensions.get('window').width;
const ITEM_MARGIN = 12;
const NUM_COLUMNS = 2;
const ITEM_SIZE = (SCREEN_WIDTH - ITEM_MARGIN * (NUM_COLUMNS + 1)) / NUM_COLUMNS;

export default function BookmarkScreen({ navigation, route }: any) {
  const { colors } = useTheme();
  const { collectionId = 0, collectionName = '' } = route?.params ?? {};

  const [mantras, setMantras] = useState<Mantra[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadCollectionMantras();
  }, [collectionId]);

  const loadCollectionMantras = async () => {
    try {
      const token = (await storage.getToken()) || 'mock-token';
      const response = await collectionService.getCollectionById(collectionId, token);

      if (response.status === 'success' && response.data) {
        setMantras(response.data.mantras);
      }
    } catch (err) {
      console.error('Error fetching collection mantras:', err);
      Alert.alert('Error', 'Failed to load mantras');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadCollectionMantras();
  };

  const renderItem = ({ item }: { item: Mantra }) => (
    <TouchableOpacity
      style={[styles.itemContainer, { backgroundColor: colors.primaryDark }]}
      onPress={() =>
        navigation.navigate('Focus', {
          mantra: item,
        })
      }
    >
      <AppText style={[styles.itemText, { color: colors.text }]} numberOfLines={3}>
        {item.title}
      </AppText>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.primary }]}>
        <View style={[styles.header, { backgroundColor: colors.primary }]}>
          <TouchableOpacity
            testID="back-button-empty"
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={28} color={colors.text} />
          </TouchableOpacity>
          <AppText style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
            {collectionName}
          </AppText>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.secondary} />
          <AppText style={[styles.loadingText, { color: colors.text }]}>Loading mantras...</AppText>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.primary }]}>
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <TouchableOpacity
          testID="back-button"
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={28} color={colors.text} />
        </TouchableOpacity>
        <AppText style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
          {collectionName}
        </AppText>
      </View>

      {mantras.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="bookmark-outline" size={64} color={colors.secondary} />
          <AppText style={[styles.emptyTitle, { color: colors.text }]}>No Mantras Yet</AppText>
          <AppText style={[styles.emptyDescription, { color: colors.text, opacity: 0.7 }]}>
            Save mantras to this collection to see them here
          </AppText>
        </View>
      ) : (
        <FlatList
          testID="mantra-list"
          data={mantras}
          keyExtractor={(item) => item.mantra_id.toString()}
          renderItem={renderItem}
          numColumns={NUM_COLUMNS}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.listContent}
          refreshing={refreshing}
          onRefresh={handleRefresh}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 56,
    paddingBottom: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  listContent: {
    padding: ITEM_MARGIN,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: ITEM_MARGIN,
  },
  itemContainer: {
    width: ITEM_SIZE,
    height: ITEM_SIZE * 0.75,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    padding: 10,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  itemText: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
