import { View, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../src/navigation/types';
import { logoutUser } from '../utils/auth';
import { storage } from '../utils/storage';
import { authService } from '../services/auth.service';
import AppText from '../components/UI/textWrapper';
import { useTheme } from '../context/ThemeContext';
import { profileSettingsStyles as styles } from '../styles/profileSettings.styles';

type ProfileNavProp = StackNavigationProp<RootStackParamList>;

export default function SettingsScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<ProfileNavProp>();

  const confirmDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you absolutely sure you want to permanently delete your account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteAccount();
          },
        },
      ],
    );
  };
  const deleteAccount = async () => {
    try {
      const token = await storage.getToken();

      if (!token) {
        Alert.alert('Error', 'Not authenticated.');
        return;
      }

      await authService.deleteAccount(token);
      showDeletedAlert();
    } catch (err: any) {
      console.error('Delete account error:', err);
      Alert.alert('Error', err?.response?.data?.message || 'Failed to delete account.');
    }
  };

  const showDeletedAlert = () => {
    Alert.alert('Account Deleted', 'Your account has been deleted. You will now be logged out.', [
      {
        text: 'OK',
        onPress: () => {
          logoutUser(navigation);
        },
      },
    ]);
  };

  const handleLogout = () => logoutUser(navigation);

  return (
    <View className="flex-1 pt-16 px-10" style={{ backgroundColor: colors.white }}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <AppText style={[styles.backText, { color: colors.primaryDark }]}>Back</AppText>
      </TouchableOpacity>
      <AppText className="text-center text-[30px] pt-5" style={{ color: colors.black }}>
        Settings
      </AppText>
      <View className="mt-20 mb-10 gap-2.5">
        <SettingsOption label="Update Email" onPress={() => navigation.navigate('UpdateEmail')} />
        <SettingsOption
          label="Update Password"
          onPress={() => navigation.navigate('UpdatePassword')}
        />
        <SettingsOption label="Delete Account" onPress={confirmDeleteAccount} destructive />
        <SettingsOption label="Sign Out" onPress={handleLogout} />
      </View>
    </View>
  );
}

function SettingsOption({
  label,
  onPress,
  destructive = false,
}: {
  label: string;
  onPress: () => void;
  destructive?: boolean;
}) {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      className="px-5 py-5 rounded-[18px]"
      style={{ backgroundColor: colors.settings }}
      onPress={onPress}
    >
      <AppText
        className="text-[16px] text-center"
        style={{ color: destructive ? colors.error : colors.black }}
      >
        {label}
      </AppText>
    </TouchableOpacity>
  );
}
