import { storage } from '../utils/storage';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../src/navigation/types';
import { useTheme } from '../context/ThemeContext';
import React, { useEffect, useState } from 'react';
import { View, TouchableOpacity, Image, ActionSheetIOS, Platform, Alert } from 'react-native';
import AppText from '../components/UI/textWrapper';
import { profileSettingsStyles as styles } from '../styles/profileSettings.styles';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import DefaultProfile from '../assets/Profile-default.png';
import { userService } from '../services/user.service';
import * as ImageManipulator from 'expo-image-manipulator';

type ProfileNavProp = StackNavigationProp<RootStackParamList>;

export default function ProfileScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<ProfileNavProp>();
  type UserState = {
    username: string;           // username is always a string
    profile_photo?: string;     // photo is optional
  };
  const [user, setUser] = useState<UserState | null>(null);

const loadUserFromServer = async () => {
  try {
    const token = await storage.getToken();
    const userId = await storage.getUserId();
    if (!token || !userId) return;

    const res = await userService.getUserById(userId, token); // call API to get current user
    if (res.status === 'success') {
      setUser({
        username: res.data.user.username || '',
        profile_photo: res.data.user.profile_photo || undefined,
      });
      await storage.saveUserData(res.data.user);
    }
  } catch (err) {
    console.error('Error fetching user from server', err);
  }
};

useEffect(() => {
  const init = async () => {
    // Load from storage first
    const storedUser = await storage.getUserData();
    if (storedUser) setUser(storedUser);

    // Then call the reusable function to fetch from server
    await loadUserFromServer();
  };
  init();
}, []);

  const uploadPickedPhoto = async (uri: string) => {
    try {
      const resized = await ImageManipulator.manipulateAsync(uri, [{ resize: { width: 800 } }], {
        compress: 0.8,
        format: ImageManipulator.SaveFormat.JPEG,
        base64: true,
      });

      const base64WithPrefix = `data:image/jpeg;base64,${resized.base64}`;

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
          username: updatedUser.username || '',          // never null
          profile_photo: updatedUser.profile_photo || undefined,
        });
        await storage.saveUserData(res.data.user);
      } else {
        console.error('Failed to update photo:', res.message);
      }
    } catch (err) {
      console.error('Error uploading photo:', err);
    }
  };

  const pickImageFromLibrary = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return alert('Permission denied!');

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.4,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      await uploadPickedPhoto(uri);
    }
  };

  const takePhotoWithCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return alert('Permission denied!');

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
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
    <View className="flex-1 pt-16 px-10" style={{ backgroundColor: colors.primary }}>
      <AppText className="text-[30px] text-left mb-5 mt-2" style={{ color: colors.text }}>
        {user?.username || ''}
      </AppText>
      <View style={{ alignSelf: 'center', alignItems: 'center', marginBottom: 5 }}>
        <Image
          source={
            user?.profile_photo
            ? { uri: user.profile_photo }
            : DefaultProfile // default profile image
          }
          style={{
            width: 150,
            height: 150,
            borderRadius: 75, // circular
          }}
        />

        <TouchableOpacity
          onPress={onEditPress}
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
      <View className="mt-10 mb-10 gap-2.5">
        <TouchableOpacity
          className="flex-row justify-between"
          style={[styles.button, { backgroundColor: colors.primaryDark }]}
          onPress={() => navigation.navigate('Reminders')}
        >
          <AppText className="text-[16px] pt-0.5" style={{ color: colors.text }}>
            Reminders
          </AppText>
          <Ionicons name="chevron-forward" size={24} color={colors.white} />
        </TouchableOpacity>
        <TouchableOpacity
          className="flex-row justify-between"
          style={[styles.button, { backgroundColor: colors.primaryDark }]}
          onPress={() => navigation.navigate('NotificationSettings')}
        >
          <AppText className="text-[16px] pt-0.5" style={{ color: colors.text }}>
            Notifications
          </AppText>
          <Ionicons name="chevron-forward" size={24} color={colors.white} />
        </TouchableOpacity>
        <TouchableOpacity
          className="flex-row justify-between"
          style={[styles.button, { backgroundColor: colors.primaryDark }]}
          onPress={() => navigation.navigate('Liked')}
        >
          <AppText className="text-[16px] pt-0.5" style={{ color: colors.text }}>
            Liked
          </AppText>
          <Ionicons name="chevron-forward" size={24} color={colors.white} />
        </TouchableOpacity>
        <TouchableOpacity
          className="flex-row justify-between"
          style={[styles.button, { backgroundColor: colors.primaryDark }]}
          onPress={() => navigation.navigate('MantraAlgorithm')}
        >
          <AppText className="text-[16px] pt-0.5" style={{ color: colors.text }}>
            Mantra Algorithm
          </AppText>
          <Ionicons name="chevron-forward" size={24} color={colors.white} />
        </TouchableOpacity>
        <TouchableOpacity
          className="flex-row justify-between"
          style={[styles.button, { backgroundColor: colors.primaryDark }]}
          onPress={() => navigation.navigate('Themes')}
        >
          <AppText className="text-[16px] pt-0.5" style={{ color: colors.text }}>
            Themes
          </AppText>
          <Ionicons name="chevron-forward" size={24} color={colors.white} />
        </TouchableOpacity>
        <TouchableOpacity
          className="flex-row justify-between"
          style={[styles.button, { backgroundColor: colors.primaryDark }]}
          onPress={() => navigation.navigate('Settings')}
        >
          <AppText className="text-[16px] pt-0.5" style={{ color: colors.text }}>
            Settings
          </AppText>
          <Ionicons name="chevron-forward" size={24} color={colors.white} />
        </TouchableOpacity>
      </View>
    </View>
  );
}
