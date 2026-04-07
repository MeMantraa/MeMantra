import React from 'react';
import { View, FlatList, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import AppText from '../components/UI/textWrapper';
import { Mantra } from '../services/mantra.service';
import { useLikedMantras } from '../hooks';

const SCREEN_WIDTH = Dimensions.get('window').width;
const ITEM_MARGIN = 12;
const NUM_COLUMNS = 2;
const ITEM_SIZE = (SCREEN_WIDTH - ITEM_MARGIN * (NUM_COLUMNS + 1)) / NUM_COLUMNS;

export default function LikedScreen({ navigation }: any) {
  const { colors } = useTheme();
  const { data, isLoading, isRefetching, refetch } = useLikedMantras();
  const mantras = data?.data?.mantras ?? [];

  const renderItem = ({ item }: { item: Mantra }) => (
    <TouchableOpacity
      className="justify-center items-center rounded-xl p-2.5 shadow-sm android:elevation-4"
      style={{
        backgroundColor: colors.primaryDark,
        width: ITEM_SIZE,
        height: ITEM_SIZE * 0.75,
        marginBottom: ITEM_MARGIN,
      }}
      onPress={() => navigation.navigate('Focus', { mantra: item })}
    >
      <AppText
        className="text-lg font-bold text-center leading-tight"
        style={{ color: colors.text }}
        numberOfLines={3}
      >
        {item.title}
      </AppText>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View className="flex-1" style={{ backgroundColor: colors.primary }}>
        <View className="pt-16 pb-4 px-5 flex-row items-center">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="mr-3 p-1"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={28} color={colors.text} />
          </TouchableOpacity>
          <AppText className="text-3xl font-bold" style={{ color: colors.text }}>
            Liked Mantras
          </AppText>
        </View>
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={colors.secondary} />
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1" style={{ backgroundColor: colors.primary }}>
      <View className="pt-16 pb-4 px-5 flex-row items-center">
        <TouchableOpacity
          testID="back-button"
          onPress={() => navigation.goBack()}
          className="mr-3 p-1"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={28} color={colors.text} />
        </TouchableOpacity>
        <AppText className="text-3xl font-bold" style={{ color: colors.text }}>
          Liked Mantras
        </AppText>
      </View>

      {mantras.length === 0 ? (
        <View className="flex-1 justify-center items-center px-10">
          <Ionicons name="heart-outline" size={64} color={colors.secondary} />
          <AppText className="text-xl font-bold mt-4 mb-2" style={{ color: colors.text }}>
            No Liked Mantras
          </AppText>
          <AppText
            className="text-base text-center leading-5 pt-2"
            style={{ color: colors.text, opacity: 0.7 }}
          >
            Like mantras from the home feed to see them here
          </AppText>
        </View>
      ) : (
        <FlatList
          testID="liked-mantra-list"
          data={mantras}
          keyExtractor={(item) => item.mantra_id.toString()}
          renderItem={renderItem}
          numColumns={NUM_COLUMNS}
          columnWrapperStyle={{ justifyContent: 'space-between', paddingHorizontal: ITEM_MARGIN }}
          contentContainerStyle={{ padding: ITEM_MARGIN }}
          refreshing={isRefetching}
          onRefresh={refetch}
        />
      )}
    </View>
  );
}
