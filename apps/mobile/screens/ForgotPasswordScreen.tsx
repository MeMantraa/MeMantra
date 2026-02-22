import React from 'react';
import { Alert } from 'react-native';
import { authService } from '../services/auth.service';
import EmailFormScreen from '../components/UI/EmailFormScreen';

export default function ForgotPasswordScreen({ navigation }: any) {
  const handleSubmit = async (email: string) => {
    const response = await authService.forgotPassword(email);

    if (response.status === 'success') {
      Alert.alert('Success', response.message, [
        {
          text: 'OK',
          onPress: () => {
            navigation.navigate('VerifyCode', { email });
          },
        },
      ]);
    } else {
      Alert.alert('Error', response.message || 'Failed to send verification code');
    }
  };

  return (
    <EmailFormScreen
      title="Forgot Password?"
      subtitle="Enter your email address and we'll send you a verification code to reset your password."
      onSubmit={handleSubmit}
      bottomLinkText="Remember your password?"
      bottomLinkLabel="Back to Login"
      onBottomLinkPress={() => navigation.navigate('Login')}
    />
  );
}
