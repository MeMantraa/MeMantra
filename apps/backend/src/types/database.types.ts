import { Generated, Insertable, Selectable, Updateable } from 'kysely';

//db interface
export interface Database {
  User: UserTable;
  Admin: AdminTable;
  Mantra: MantraTable;
  Category: CategoryTable;
  MantraCategory: MantraCategoryTable;
  Like: LikeTable;
  Collection: CollectionTable;
  CollectionMantra: CollectionMantraTable;
  Reminder: ReminderTable;
  RecommendationLog: RecommendationLogTable;
  PasswordResetToken: PasswordResetTokenTable;
  Conversation: ConversationTable;
  Message: MessageTable;
  MessageReaction: MessageReactionTable;
  Rating: RatingTable;
  JournalEntry: JournalEntryTable;
  UserCategoryScore: UserCategoryScoreTable;
  EngagementEvent: EngagementEventTable;
  PerformanceEvent: PerformanceEventTable;
  EmailVerificationToken: EmailVerificationTokenTable;
}

//table interfaces
export interface UserTable {
  user_id: Generated<number>;
  first_name: string | null;
  last_name: string | null;
  username: string | null;
  email: string | null;
  password_hash: string | null;
  device_token: string | null;
  auth_provider: string | null;
  theme: string | null;
  created_at: string | null;
  timezone: string | null;
  recommendation_notif_sent_at: string | null;
  optimal_send_hour: number | null;
  feature_flags: string[];
}

export interface AdminTable {
  admin_id: number;
  role: string | null;
}

export interface MantraTable {
  mantra_id: Generated<number>;
  title: string | null;
  key_takeaway: string | null;
  background_author: string | null;
  background_description: string | null;
  jamie_take: string | null;
  when_where: string | null;
  negative_thoughts: string | null;
  cbt_principles: string | null;
  references: string | null;
  created_by: number | null;
  is_active: boolean | null;
  created_at: string | null;
}

export interface CategoryTable {
  category_id: Generated<number>;
  name: string;
  description: string | null;
  category_type: string | null;
  parent_id: number | null;
  image_url: string | null;
  is_active: boolean | null;
}

export interface MantraCategoryTable {
  mantra_id: number;
  category_id: number;
}

export interface LikeTable {
  like_id: Generated<number>;
  user_id: number | null;
  mantra_id: number | null;
  created_at: string | null;
}

export interface CollectionTable {
  collection_id: Generated<number>;
  user_id: number | null;
  name: string | null;
  description: string | null;
  created_at: string | null;
  icon: string | null;
}

export interface CollectionMantraTable {
  collection_id: number;
  mantra_id: number;
  added_at: string | null;
  added_by: number | null;
}

export interface ReminderTable {
  reminder_id: Generated<number>;
  user_id: number | null;
  mantra_id: number | null;
  collection_id: number | null;
  time: string | null;
  frequency: string | null;
  status: string | null;
  last_sent_at: string | null;
  schedule_times: string[] | null;
  schedule_days: number[] | null;
  timezone: string | null;
}

export interface RecommendationLogTable {
  rec_id: Generated<number>;
  user_id: number | null;
  mantra_id: number | null;
  timestamp: string | null;
  reason: string | null;
}

export interface PasswordResetTokenTable {
  token_id: Generated<number>;
  user_id: number;
  code: string;
  expires_at: string;
  created_at: string | null;
}

export interface ConversationTable {
  conversation_id: Generated<number>;
  user1_id: number;
  user2_id: number;
  created_at: string;
  updated_at: string;
}

export interface MessageTable {
  message_id: Generated<number>;
  conversation_id: number;
  sender_id: number;
  content: string;
  created_at: string;
  read: boolean;
  reply_to_message_id: number | null;
}

export interface MessageReactionTable {
  reaction_id: Generated<number>;
  message_id: number;
  user_id: number;
  emoji: string;
  created_at: Generated<string>;
}

export interface RatingTable {
  rating_id: Generated<number>;
  user_id: number;
  mantra_id: number;
  rating: number;
  review_text: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface JournalEntryTable {
  journal_id: Generated<number>;
  user_id: number;
  mantra_id: number | null;
  title: string | null;
  content: string;
  mood: string | null;
  tags: string[] | null;
  is_private: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface UserCategoryScoreTable {
  user_id: number;
  category_id: number;
  score: number;
  updated_at: string;
}

//types for type safe operations (typescript ting)
export type User = Selectable<UserTable>;
export type NewUser = Insertable<UserTable>;
export type UserUpdate = Updateable<UserTable>;

export type Admin = Selectable<AdminTable>;
export type NewAdmin = Insertable<AdminTable>;
export type AdminUpdate = Updateable<AdminTable>;

export type Mantra = Selectable<MantraTable>;
export type NewMantra = Insertable<MantraTable>;
export type MantraUpdate = Updateable<MantraTable>;

export type Category = Selectable<CategoryTable>;
export type NewCategory = Insertable<CategoryTable>;
export type CategoryUpdate = Updateable<CategoryTable>;

export type Like = Selectable<LikeTable>;
export type NewLike = Insertable<LikeTable>;
export type LikeUpdate = Updateable<LikeTable>;

export type Collection = Selectable<CollectionTable>;
export type NewCollection = Insertable<CollectionTable>;
export type CollectionUpdate = Updateable<CollectionTable>;

export type CollectionMantra = Selectable<CollectionMantraTable>;
export type NewCollectionMantra = Insertable<CollectionMantraTable>;
export type CollectionMantraUpdate = Updateable<CollectionMantraTable>;

export type Reminder = Selectable<ReminderTable>;
export type NewReminder = Insertable<ReminderTable>;
export type ReminderUpdate = Updateable<ReminderTable>;

export type RecommendationLog = Selectable<RecommendationLogTable>;
export type NewRecommendationLog = Insertable<RecommendationLogTable>;
export type RecommendationLogUpdate = Updateable<RecommendationLogTable>;

export type PasswordResetToken = Selectable<PasswordResetTokenTable>;
export type NewPasswordResetToken = Insertable<PasswordResetTokenTable>;
export type PasswordResetTokenUpdate = Updateable<PasswordResetTokenTable>;

export type Conversation = Selectable<ConversationTable>;
export type NewConversation = Insertable<ConversationTable>;
export type ConversationUpdate = Updateable<ConversationTable>;

export type Message = Selectable<MessageTable>;
export type NewMessage = Insertable<MessageTable>;
export type MessageUpdate = Updateable<MessageTable>;

export type MessageReaction = Selectable<MessageReactionTable>;
export type NewMessageReaction = Insertable<MessageReactionTable>;
export type MessageReactionUpdate = Updateable<MessageReactionTable>;

export type Rating = Selectable<RatingTable>;
export type NewRating = Insertable<RatingTable>;
export type RatingUpdate = Updateable<RatingTable>;

export type JournalEntry = Selectable<JournalEntryTable>;
export type NewJournalEntry = Insertable<JournalEntryTable>;
export type JournalEntryUpdate = Updateable<JournalEntryTable>;

export type UserCategoryScore = Selectable<UserCategoryScoreTable>;
export type NewUserCategoryScore = Insertable<UserCategoryScoreTable>;
export type UserCategoryScoreUpdate = Updateable<UserCategoryScoreTable>;

export interface EmailVerificationTokenTable {
  token_id: Generated<number>;
  email: string;
  code: string;
  expires_at: string;
  created_at: string | null;
}

export interface EngagementEventTable {
  event_id: Generated<number>;
  user_id: number;
  event_type: string;
  occurred_at: Generated<string>;
}

export interface PerformanceEventTable {
  event_id: Generated<number>;
  kind: string;
  name: string;
  duration_ms: number;
  status: string;
  source: string;
  route: string | null;
  method: string | null;
  screen: string | null;
  request_id: string | null;
  platform: string | null;
  app_version: string | null;
  metadata: Record<string, unknown> | null;
  occurred_at: Generated<string>;
}

export type EngagementEvent = Selectable<EngagementEventTable>;
export type NewEngagementEvent = Insertable<EngagementEventTable>;
export type EngagementEventUpdate = Updateable<EngagementEventTable>;

export type PerformanceEvent = Selectable<PerformanceEventTable>;
export type NewPerformanceEvent = Insertable<PerformanceEventTable>;
export type PerformanceEventUpdate = Updateable<PerformanceEventTable>;

export type EmailVerificationToken = Selectable<EmailVerificationTokenTable>;
export type NewEmailVerificationToken = Insertable<EmailVerificationTokenTable>;