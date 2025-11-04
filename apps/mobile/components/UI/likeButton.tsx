import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

type LikeButtonProps = {
  liked: boolean;
  onPress: () => void;
};

const LikeButton: React.FC<LikeButtonProps> = ({ liked, onPress }) => {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      testID="like-button"
      activeOpacity={0.7}
      onPress={onPress}
      className="items-center justify-center"
    >
      <View
        className="w-[55px] h-[55px] rounded-full items-center justify-center"
        style={{ backgroundColor: colors.primaryDark }}
      >
        <Ionicons
          name={liked ? 'heart' : 'heart-outline'}
          size={35}
          color={liked ? colors.secondary : '#F5E6D3'}
          style={{ marginTop: 2 }}
        />
      </View>
    </TouchableOpacity>
  );
};

export default LikeButton;
