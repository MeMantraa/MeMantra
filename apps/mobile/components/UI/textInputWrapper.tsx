import React, { forwardRef } from 'react';
import { TextInput, TextInputProps, StyleSheet } from 'react-native';

const AppTextInput = forwardRef<TextInput, TextInputProps>((props, ref) => (
  <TextInput
    ref={ref}
    {...props}
    style={[styles.input, props.style]}
    placeholderTextColor={props.placeholderTextColor || '#888'}
  />
));

export default AppTextInput;

const styles = StyleSheet.create({
  input: {
    fontFamily: 'LibreBaskerville-Regular',
    fontSize: 16,
    color: '#222',
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    backgroundColor: '#fff',
  },
});
