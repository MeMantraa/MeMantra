import React from 'react';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

type LikeButtonProps = {
  liked: boolean;
  onPress: () => void;
};

const LikeButton: React.FC<LikeButtonProps> = ({ liked, onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity activeOpacity={0.7} onPress={onPress} className="items-center justify-center">
      <Ionicons
        name={liked ? 'heart' : 'heart-outline'}
        size={38}
        color={liked ? colors.secondary : colors.text}
      />
    </TouchableOpacity>
  );
};

export default LikeButton;
