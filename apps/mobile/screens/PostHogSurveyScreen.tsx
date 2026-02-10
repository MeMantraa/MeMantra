import React, { useMemo } from 'react';
import { View, TouchableOpacity, ActivityIndicator, Linking } from 'react-native';
import { WebView } from 'react-native-webview';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../src/navigation/types';
import AppText from '../components/UI/textWrapper';
import { useTheme } from '../context/ThemeContext';
import { posthog } from '../services/posthog';
import { profileSettingsStyles as styles } from '../styles/profileSettings.styles';
import { usePostHogScreen } from '../utils/posthog';

const SURVEY_ID = '019c0636-ab6a-0000-8d35-bcc638155211';
const BASE_URL = `https://us.posthog.com/external_surveys/${SURVEY_ID}?embed=true`;

type NavProp = StackNavigationProp<RootStackParamList>;

export default function PostHogSurveyScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<NavProp>();
  usePostHogScreen();

  const surveyUrl = useMemo(() => {
    const distinctId = posthog.getDistinctId();
    return distinctId ? `${BASE_URL}&distinct_id=${encodeURIComponent(distinctId)}` : BASE_URL;
  }, []);

  return (
    <View className="flex-1 pt-16 px-6" style={{ backgroundColor: colors.white }}>
      <TouchableOpacity
        onPress={() => {
          posthog.capture('posthog_survey_back_pressed');
          navigation.goBack();
        }}
        style={styles.backButton}
      >
        <AppText style={[styles.backText, { color: colors.primaryDark }]}>Back</AppText>
      </TouchableOpacity>
      <AppText className="text-center text-[24px] pt-3" style={{ color: colors.black }}>
        Survey
      </AppText>
      <TouchableOpacity
        onPress={() => {
          posthog.capture('posthog_survey_open_web');
          void Linking.openURL(surveyUrl);
        }}
        style={{ alignSelf: 'center', marginTop: 8, marginBottom: 8 }}
      >
        <AppText style={{ color: colors.primaryDark }}>Open in the web</AppText>
      </TouchableOpacity>
      <View className="flex-1 mt-6">
        <WebView
          originWhitelist={['*']}
          source={{ uri: surveyUrl }}
          javaScriptEnabled
          domStorageEnabled
          sharedCookiesEnabled
          thirdPartyCookiesEnabled
          startInLoadingState
          renderLoading={() => (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="large" color={colors.primaryDark} />
            </View>
          )}
          onError={(e) => {
            console.warn('PostHog survey WebView error:', e.nativeEvent);
            posthog.capture('posthog_survey_webview_error');
          }}
          onHttpError={(e) => {
            console.warn('PostHog survey WebView HTTP error:', e.nativeEvent);
            posthog.capture('posthog_survey_webview_http_error');
          }}
          onLoadEnd={() => {
            console.log('PostHog survey WebView loaded:', surveyUrl);
            posthog.capture('posthog_survey_webview_loaded');
          }}
        />
      </View>
    </View>
  );
}
