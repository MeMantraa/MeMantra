import React from 'react';
import { Text, TextProps, StyleSheet, Platform } from 'react-native';
import { cssInterop } from 'nativewind';

type AppTextProps = TextProps & {
  className?: string;
};

function AppTextBase(props: Readonly<AppTextProps>) {
  return (
    <Text
      {...props}
      style={[
        styles.text,

        // Android: helps prevent baseline/descender clipping with some fonts
        // c8 ignore next
        Platform.OS === 'android' ? styles.androidTextFix : null,

        props.style,
      ]}
    >
      {props.children}
    </Text>
  );
}

const AppText = cssInterop(AppTextBase, { className: 'style' });
export default AppText;

const styles = StyleSheet.create({
  text: {
    fontFamily: 'LibreBaskerville-Regular',
  },
  androidTextFix: {
    includeFontPadding: false,
    textAlignVertical: 'center',
    lineHeight: 22,
  },
});
