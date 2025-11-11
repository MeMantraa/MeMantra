import { db } from '../db';
import bcrypt from 'bcryptjs';
import { User, NewUser } from '../types/database.types';

interface CreateUserData {
  username: string;
  email: string;
  password: string;
  device_token?: string | null;
  google_id?: string | null;
  auth_provider?: 'local' | 'google';
}

export const UserModel = {
  async create(userData: CreateUserData): Promise<User> {
    //hash pass
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(userData.password, salt);
    
    //data for insertion
    const newUser: NewUser = {
      username: userData.username,
      email: userData.email,
      password_hash: hashedPassword,
      device_token: userData.device_token || null,
      created_at: new Date().toISOString(),
    };
    
    //insert in db
    const result = await db
      .insertInto('User')
      .values(newUser)
      .returningAll()
      .executeTakeFirstOrThrow();
    
    return result;
  },
  
  async findByEmail(email: string): Promise<User | undefined> {
    const user = await db
      .selectFrom('User')
      .where('email', '=', email)
      .selectAll()
      .executeTakeFirst();
    
    return user;
  },
  
  async findByUsername(username: string): Promise<User | undefined> {
    const user = await db
      .selectFrom('User')
      .where('username', '=', username)
      .selectAll()
      .executeTakeFirst();
    
    return user;
  },
  
  async findById(id: number): Promise<User | undefined> {
    const user = await db
      .selectFrom('User')
      .where('user_id', '=', id)
      .selectAll()
      .executeTakeFirst();
    
    return user;
  },

  async findAll(): Promise<User[]> {
  const users = await db
    .selectFrom('User')
    .selectAll()
    .orderBy('created_at', 'desc')
    .execute();
  
  return users;
},

async update(id: number, updates: Partial<User>): Promise<User | undefined> {
  const user = await db
    .updateTable('User')
    .set(updates)
    .where('user_id', '=', id)
    .returningAll()
    .executeTakeFirst();
  
  return user;
},

async delete(id: number): Promise<boolean> {
  const result = await db
    .deleteFrom('User')
    .where('user_id', '=', id)
    .executeTakeFirst();
  
  return result.numDeletedRows > 0;
},
};

