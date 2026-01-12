import { Conversation } from '../../types/chat.types';
import { Mantra } from '../../services/mantra.service';

export type RootStackParamList = {
  MainApp: undefined;
  Login: undefined;
  Signup: undefined;
  UpdateEmail: undefined;
  UpdatePassword: undefined;
  Chat: undefined;
  Conversation: { conversation: Conversation };
  Focus: { mantra: Mantra };
};
