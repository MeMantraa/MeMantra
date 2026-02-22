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

type ProfileNavProp = StackNavigationProp<RootStackParamList>;

export default function ProfileScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<ProfileNavProp>();
  const [username, setUsername] = useState<string>('');
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const user = await storage.getUserData();
      setUsername(user?.username || '');
    };
    load();
  }, []);

  const pickImageFromLibrary = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return alert('Permission denied!');

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) setProfilePhoto(result.assets[0].uri);
  };

  const takePhotoWithCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return alert('Permission denied!');

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) setProfilePhoto(result.assets[0].uri);
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
        {username}
      </AppText>
      <View style={{ alignSelf: 'center', alignItems: 'center', marginBottom: 5 }}>
        <Image
          source={
            profilePhoto ? { uri: profilePhoto } : DefaultProfile // default profile image
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
