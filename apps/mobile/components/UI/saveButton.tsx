import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

type SaveButtonProps = {
  saved: boolean;
  onPress: () => void;
};

const SaveButton: React.FC<SaveButtonProps> = ({ saved, onPress }) => {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      testID="save-button"
      activeOpacity={0.7}
      onPress={onPress}
      className="items-center justify-center mb-6"
    >
      <View
        className="w-[55px] h-[55px] rounded-full items-center justify-center"
        style={{ backgroundColor: colors.primaryDark }}
      >
        <Ionicons
          name={saved ? 'bookmark' : 'bookmark-outline'}
          size={35}
          color="white"
          style={{ marginTop: 2 }}
        />
      </View>
    </TouchableOpacity>
  );
};

export default SaveButton;
