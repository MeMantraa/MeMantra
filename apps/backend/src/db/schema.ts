import { Generated, ColumnType } from 'kysely';

export interface Database {
  users: UserTable;
}

export interface UserTable {
  id: Generated<number>;
  email: string;
  password: string;
  full_name: string | null;
  created_at: ColumnType<Date, string | undefined, never>;
  updated_at: ColumnType<Date, string | undefined, never>;
  last_login: ColumnType<Date | null, string | undefined, string | Date | null>;
  reset_token: string | null;
  reset_token_expires: ColumnType<Date | null, string | undefined, string | Date | null>;
}