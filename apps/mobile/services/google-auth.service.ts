import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';

WebBrowser.maybeCompleteAuthSession();

// ✅ no TS errors, fully typed
const redirectUri = makeRedirectUri({
  ...({ useProxy: true } as any),
  path: 'redirect',
});

console.log('Redirect URI:', redirectUri);

export const useGoogleAuth = () => {
  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: '837744591033-ju2acrfhaivd2hhc87f5hrhltgp5bu00.apps.googleusercontent.com',
    iosClientId: '837744591033-vbeh1un6ghnm6t5q86cd5b0ub102m600.apps.googleusercontent.com',
    webClientId: '837744591033-20bvurqlp4oef9s0k5a3phuf29ku9rfv.apps.googleusercontent.com',
    scopes: ['profile', 'email'],
    redirectUri,
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
