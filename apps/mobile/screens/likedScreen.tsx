import React, { useMemo } from 'react';
import { View, Text, FlatList, Dimensions } from 'react-native';
import { useLikes } from '../context/LikedMantrasContext';
import MantraCarousel from '../components/carousel';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function LikedScreen() {
  const { liked } = useLikes();
  const data = useMemo(() => Object.values(liked), [liked]);

  if (data.length === 0) {
    return (
      <View className="flex-1 bg-[#9AA793] items-center justify-center px-6">
        <Text className="text-white text-lg text-center">No liked mantras yet.</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#9AA793]">
      <FlatList
        data={data}
        keyExtractor={(item) => item.mantra_id.toString()}
        renderItem={({ item }) => <MantraCarousel item={item} />}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToAlignment="start"
        decelerationRate="fast"
        snapToInterval={SCREEN_HEIGHT}
      />
    </View>
  );
}
