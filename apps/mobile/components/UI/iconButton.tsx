import React from 'react';
import { TouchableOpacity, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

type IconButtonProps = {
  type: 'like' | 'save' | 'share' | 'profile';
  active?: boolean;
  onPress: () => void;
  testID?: string;
  className?: string;
  style?: ViewStyle;
};

const IconButton: React.FC<IconButtonProps> = ({
  type,
  active,
  onPress,
  testID,
  className = '',
  style,
}) => {
  const { colors } = useTheme();

  const getIconConfig = () => {
    switch (type) {
      case 'like':
        return {
          iconName: active ? 'heart' : 'heart-outline',
          iconColor: active ? colors.secondary : '#F5E6D3',
          defaultTestID: 'like-button',
          backgroundColor: colors.primaryDark,
          iconSize: 35,
          buttonSize: 55,
        };
      case 'save':
        return {
          iconName: active ? 'bookmark' : 'bookmark-outline',
          iconColor: 'white',
          defaultTestID: 'save-button',
          backgroundColor: colors.primaryDark,
          iconSize: 35,
          buttonSize: 55,
        };
      case 'profile':
        return {
          iconName: 'person-outline',
          iconColor: colors.primaryDark,
          defaultTestID: 'profile-btn',
          backgroundColor: colors.secondary,
          iconSize: 24,
          buttonSize: 48,
        };
      case 'share':
        return {
          iconName: 'paper-plane-outline',
          iconColor: 'white',
          defaultTestID: 'share-button',
          backgroundColor: colors.primaryDark,
          iconSize: 35,
          buttonSize: 55,
        };
      default:
        return {
          iconName: 'help-outline',
          iconColor: 'white',
          defaultTestID: 'icon-button',
          backgroundColor: colors.primaryDark,
          iconSize: 35,
          buttonSize: 55,
        };
    }
  };

  const config = getIconConfig();

  return (
    <TouchableOpacity
      testID={testID || config.defaultTestID}
      activeOpacity={0.7}
      onPress={onPress}
      className={`items-center justify-center ${className}`}
      style={style}
    >
      <View
        className="rounded-full items-center justify-center"
        style={{
          width: config.buttonSize,
          height: config.buttonSize,
          backgroundColor: config.backgroundColor,
        }}
      >
        <Ionicons
          name={config.iconName as any}
          size={config.iconSize}
          color={config.iconColor}
          style={{ marginTop: 2 }}
        />
      </View>
    </TouchableOpacity>
  );
};

export default IconButton;
