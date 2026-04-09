import { storage } from '../utils/storage';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../src/navigation/types';
import { useTheme } from '../context/ThemeContext';
import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  ActionSheetIOS,
  Platform,
  Alert,
  Linking,
} from 'react-native';
import AppText from '../components/UI/textWrapper';
import { profileSettingsStyles as styles } from '../styles/profileSettings.styles';
import { Ionicons } from '@expo/vector-icons';
import DefaultProfile from '../assets/Profile-default.png';
import { userService } from '../services/user.service';
import { photoUploadUtils } from '../utils/photoUpload';

type ProfileNavProp = StackNavigationProp<RootStackParamList>;

export default function ProfileScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<ProfileNavProp>();
  type UserState = {
    username: string; // username is always a string
    profile_photo?: string; // photo is optional
  };
  const [user, setUser] = useState<UserState | null>(null);

  const validFlags = ['EXPERIMENTAL_FEATURE', 'DARK_MODE', 'ADVANCED_ANALYTICS'] as const;

  type FeatureFlag = (typeof validFlags)[number];

  const filterFeatureFlags = (flags?: string[]): FeatureFlag[] | undefined => {
    return flags?.filter((flag): flag is FeatureFlag => validFlags.includes(flag as FeatureFlag));
  };

  const loadUserFromServer = async () => {
    try {
      const token = await storage.getToken();
      const userId = await storage.getUserId();
      if (!token || !userId) return;

      const res = await userService.getUserById(userId, token); // call API to get current user
      if (res.status === 'success') {
        setUser((prev) => ({
          username: res.data.user.username ?? prev?.username ?? '',
          profile_photo: res.data.user.profile_photo || prev?.profile_photo,
        }));
        await storage.saveUserData({
          ...res.data.user,
          feature_flags: filterFeatureFlags(res.data.user.feature_flags),
        });
      }
    } catch (err) {
      console.error('Error fetching user from server', err);
    }
  };

  useEffect(() => {
    const init = async () => {
      // Load from storage first
      const storedUser = await storage.getUserData();
      if (storedUser) {
        setUser((prev) => ({
          username: storedUser.username ?? prev?.username ?? '',
          profile_photo:
            typeof storedUser.profile_photo === 'string'
              ? storedUser.profile_photo
              : prev?.profile_photo,
        }));
      }

      // Then call the reusable function to fetch from server
      await loadUserFromServer();
    };
    init();
  }, []);

  const uploadPickedPhoto = async (uri: string) => {
    try {
      const base64WithPrefix = await photoUploadUtils.resizeAndConvertToBase64(uri);
      await uploadPhoto(base64WithPrefix);
    } catch (err) {
      console.error('Error converting/uploading photo:', err);
    }
  };

  const uploadPhoto = async (base64WithPrefix: string) => {
    try {
      const token = (await storage.getToken()) || 'mock-token';
      const res = await userService.updateProfilePhoto(base64WithPrefix, token);

      if (res.status === 'success') {
        const updatedUser = res.data.user;
        // update local state if you have user profile in context or state
        setUser({
          username: updatedUser.username || '', // never null
          profile_photo: updatedUser.profile_photo || undefined,
        });
        await storage.saveUserData({
          ...res.data.user,
          feature_flags: filterFeatureFlags(res.data.user.feature_flags),
        });
      } else {
        console.error('Failed to update photo:', res.message);
      }
    } catch (err) {
      console.error('Error uploading photo:', err);
    }
  };

  const pickImageFromLibrary = async () => {
    const hasPermission = await photoUploadUtils.requestLibraryPermission();
    if (!hasPermission) return alert('Permission denied!');

    const uri = await photoUploadUtils.pickImageFromLibrary();
    if (uri) {
      await uploadPickedPhoto(uri);
    }
  };

  const takePhotoWithCamera = async () => {
    const hasPermission = await photoUploadUtils.requestCameraPermission();
    if (!hasPermission) return alert('Permission denied!');

    const uri = await photoUploadUtils.takePhotoWithCamera();
    if (uri) {
      await uploadPickedPhoto(uri);
    }
  };

  const onEditPress = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Take Photo', 'Choose from Library'],
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) takePhotoWithCamera();
          else if (buttonIndex === 2) pickImageFromLibrary();
        },
      );
    } else {
      Alert.alert('Edit Profile Photo', 'Choose an option', [
        { text: 'Take Photo', onPress: takePhotoWithCamera },
        { text: 'Choose from Library', onPress: pickImageFromLibrary },
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.primary }}>
      <ScrollView
        contentContainerStyle={{ paddingTop: 64, paddingHorizontal: 40, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <AppText
          className="text-[30px] font-bold text-left mb-10 mt-2"
          style={{ color: colors.text }}
        >
          {user?.username || ''}
        </AppText>
        <View style={{ alignSelf: 'center', alignItems: 'center', marginBottom: 5 }}>
          <Image
            source={
              user?.profile_photo ? { uri: user.profile_photo } : DefaultProfile // default profile image
            }
            style={{
              width: 150,
              height: 150,
              borderRadius: 75, // circular
            }}
          />

          <TouchableOpacity
            onPress={onEditPress}
            testID="edit-photo-button"
            style={{
              marginTop: 8,
              paddingVertical: 4,
              paddingHorizontal: 12,
              borderRadius: 12,
              backgroundColor: colors.secondary,
            }}
          >
            <AppText style={{ color: colors.white, fontSize: 14 }}>Edit</AppText>
          </TouchableOpacity>
        </View>
        <View style={{ marginTop: 22, marginBottom: 40 }}>
          <TouchableOpacity
            style={[
              { marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between' },
              styles.button,
              { backgroundColor: colors.primaryDark },
            ]}
            onPress={() => navigation.navigate('Reminders')}
          >
            <AppText className="text-[16px] pt-0.5" style={{ color: colors.text }}>
              Reminders
            </AppText>
            <Ionicons name="chevron-forward" size={24} color={colors.white} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              { marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between' },
              styles.button,
              { backgroundColor: colors.primaryDark },
            ]}
            onPress={() => navigation.navigate('NotificationSettings')}
          >
            <AppText className="text-[16px] pt-0.5" style={{ color: colors.text }}>
              Notifications Settings
            </AppText>
            <Ionicons name="chevron-forward" size={24} color={colors.white} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              { marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between' },
              styles.button,
              { backgroundColor: colors.primaryDark },
            ]}
            onPress={() => navigation.navigate('Liked')}
          >
            <AppText className="text-[16px] pt-0.5" style={{ color: colors.text }}>
              Liked
            </AppText>
            <Ionicons name="chevron-forward" size={24} color={colors.white} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              { marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between' },
              styles.button,
              { backgroundColor: colors.primaryDark },
            ]}
            onPress={() => navigation.navigate('MantraAlgorithm')}
          >
            <AppText className="text-[16px] pt-0.5" style={{ color: colors.text }}>
              Mantra Algorithm
            </AppText>
            <Ionicons name="chevron-forward" size={24} color={colors.white} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              { marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between' },
              styles.button,
              { backgroundColor: colors.primaryDark },
            ]}
            onPress={() => navigation.navigate('Themes')}
          >
            <AppText className="text-[16px] pt-0.5" style={{ color: colors.text }}>
              Themes
            </AppText>
            <Ionicons name="chevron-forward" size={24} color={colors.white} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              { marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between' },
              styles.button,
              { backgroundColor: colors.primaryDark },
            ]}
            onPress={() => Linking.openURL('https://memantra.onrender.com/terms-of-use')}
          >
            <AppText className="text-[16px] pt-0.5" style={{ color: colors.text }}>
              Terms of Use
            </AppText>
            <Ionicons name="chevron-forward" size={24} color={colors.white} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              { marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between' },
              styles.button,
              { backgroundColor: colors.primaryDark },
            ]}
            onPress={() => navigation.navigate('Settings')}
          >
            <AppText className="text-[16px] pt-0.5" style={{ color: colors.text }}>
              Settings
            </AppText>
            <Ionicons name="chevron-forward" size={24} color={colors.white} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
