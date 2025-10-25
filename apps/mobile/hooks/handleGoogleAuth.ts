import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { useGoogleAuth, fetchGoogleUserInfo } from '../services/google-auth.service';
import { authService } from '../services/auth.service';
import { storage } from '../utils/storage';
import * as AuthSession from 'expo-auth-session';

function isSuccessResponse(
  response: AuthSession.AuthSessionResult | null,
): response is AuthSession.AuthSessionResult & {
  type: 'success';
  authentication: { accessToken: string };
} {
  return (
    !!response && response.type === 'success' && !!(response as any).authentication?.accessToken
  );
}

export function useGoogleSignIn(onSuccess?: (user: any) => void) {
  const { request, response, promptAsync } = useGoogleAuth();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isSuccessResponse(response)) {
      handleGoogleResponse(response.authentication.accessToken);
    }
  }, [response]);

  const handleGoogleResponse = async (accessToken: string) => {
    setLoading(true);
    try {
      const userInfo = await fetchGoogleUserInfo(accessToken);
      const authResponse = await authService.googleAuth({
        email: userInfo.email,
        name: userInfo.name,
        googleId: userInfo.id,
      });

      if (authResponse.status === 'success') {
        await storage.saveToken(authResponse.data.token);
        await storage.saveUserData(authResponse.data.user);
        Alert.alert('Success', 'Signed in with Google!');
        onSuccess?.(authResponse.data.user);
      }
    } catch (error: any) {
      console.error('Google auth error:', error);
      Alert.alert('Error', 'Google authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    try {
      await promptAsync();
    } catch (error) {
      console.error('Google sign-in error:', error);
      Alert.alert('Error', 'Failed to initiate Google sign-in');
    }
  };

  return { signInWithGoogle, request, loading };
}
