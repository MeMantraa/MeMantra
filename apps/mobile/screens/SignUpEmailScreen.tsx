import React from 'react';
import { Alert } from 'react-native';
import { authService } from '../services/auth.service';
import EmailFormScreen from '../components/UI/EmailFormScreen';

export default function SignUpEmailScreen({ navigation }: any) {
  const handleSubmit = async (email: string) => {
    const response = await authService.sendSignupCode(email);

    if (response.status === 'success') {
      navigation.navigate('VerifyCode', { email, flow: 'signup' });
    } else {
      Alert.alert('Error', response.message || 'Failed to send verification code');
    }
  };

  return (
    <EmailFormScreen
      title="Create Account"
      subtitle="Enter your email address and we'll send you a verification code."
      onSubmit={handleSubmit}
      bottomLinkText="Already have an account?"
      bottomLinkLabel="Login"
      onBottomLinkPress={() => navigation.navigate('Login')}
    />
  );
}
