import React from 'react';
import { TouchableOpacity, TextStyle, ViewStyle } from 'react-native';
import type { StyleProp } from 'react-native';
import AppText from './textWrapper';

type TextButtonProps = {
  onPress: () => void;
  className?: string;
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
  textClassName?: string;
  textStyle?: StyleProp<TextStyle>;
};

const TextButton: React.FC<TextButtonProps> = ({
  onPress,
  children,
  className = '',
  textClassName = '',
  textStyle,
  style,
  disabled,
}) => {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      className={`items-center justify-center ${className}`}
      onPress={onPress}
      style={style}
      disabled={disabled}
    >
      <AppText className={textClassName} style={textStyle}>
        {children}
      </AppText>
    </TouchableOpacity>
  );
};
export default TextButton;
