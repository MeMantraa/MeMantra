import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';

WebBrowser.maybeCompleteAuthSession();

const WEB_CLIENT_ID = '837744591033-ju2acrfhaivd2hhc87f5hrhltgp5bu00.apps.googleusercontent.com';

const GOOGLE_CLIENT_ID = {
  expoClientId: WEB_CLIENT_ID,
  iosClientId: WEB_CLIENT_ID,
  androidClientId: WEB_CLIENT_ID,
  webClientId: WEB_CLIENT_ID,
};

export const useGoogleAuth = () => {
  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: GOOGLE_CLIENT_ID.expoClientId,
    iosClientId: GOOGLE_CLIENT_ID.iosClientId,
    androidClientId: GOOGLE_CLIENT_ID.androidClientId,
    webClientId: GOOGLE_CLIENT_ID.webClientId,
    scopes: ['profile', 'email'],
  });

  return { request, response, promptAsync };
};

export interface GoogleUserInfo {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
}

export const fetchGoogleUserInfo = async (accessToken: string): Promise<GoogleUserInfo> => {
  const response = await fetch('https://www.googleapis.com/userinfo/v2/me', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch user info');
  }

  return response.json();
};
