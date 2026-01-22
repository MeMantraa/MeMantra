import { Conversation } from '../../types/chat.types';
import { Mantra } from '../../services/mantra.service';

export type RootStackParamList = {
  MainApp: undefined;
  Login: undefined;
  Signup: undefined;
  UpdateEmail: undefined;
  UpdatePassword: undefined;
  NotificationSettings: undefined;
  Chat: undefined;
  Conversation: { conversation: Conversation };
  Focus: { mantra: Mantra };
  Notifications: undefined;
  Liked: undefined;
  Settings: undefined;
};
