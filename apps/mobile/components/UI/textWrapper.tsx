import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
import { cssInterop } from 'nativewind';

type AppTextProps = TextProps & {
  className?: string;
};

function AppTextBase(props: Readonly<AppTextProps>) {
  return (
    <Text {...props} style={[styles.text, props.style]}>
      {props.children}
    </Text>
  );
}

const AppText = cssInterop(AppTextBase, { className: 'style' });

export default AppText;

const styles = StyleSheet.create({
  text: {
    fontFamily: 'LibreBaskerville-Regular',
    color: '#222',
  },
});
