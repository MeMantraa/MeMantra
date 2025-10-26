import React from 'react';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type SaveButtonProps = {
  saved: boolean;
  onPress: () => void;
};

const SaveButton: React.FC<SaveButtonProps> = ({ saved, onPress }) => {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      className="items-center justify-center mb-6"
    >
      <Ionicons name={saved ? 'bookmark' : 'bookmark-outline'} size={38} color="white" />
    </TouchableOpacity>
  );
};

export default SaveButton;
