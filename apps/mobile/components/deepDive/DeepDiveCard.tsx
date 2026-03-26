import React from 'react';
import { View } from 'react-native';
import AppText from '../UI/textWrapper';

type DeepDiveCardProps = {
  label: string;
  children: React.ReactNode;
  muted?: boolean;
  accentColor: string;
  textColor: string;
  backgroundColor: string;
  borderColor: string;
};

export default function DeepDiveCard({
  label,
  children,
  muted = false,
  accentColor,
  textColor,
  backgroundColor,
  borderColor,
}: Readonly<DeepDiveCardProps>) {
  return (
    <View
      style={{
        borderRadius: 18,
        borderWidth: 1,
        borderColor,
        backgroundColor,
        paddingHorizontal: 18,
        paddingVertical: 15,
        marginBottom: 10,
        shadowColor: '#1f2a1f',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.09,
        shadowRadius: 10,
        elevation: 2,
      }}
    >
      <AppText
        style={{
          color: muted ? textColor : accentColor,
          opacity: muted ? 0.72 : 0.9,
          fontSize: 11,
          letterSpacing: 1.05,
          marginBottom: 7,
        }}
      >
        {label.toUpperCase()}
      </AppText>
      {children}
    </View>
  );
}
