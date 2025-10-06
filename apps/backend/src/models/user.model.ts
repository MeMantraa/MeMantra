//user model for db operations (update, find, create etc....)
import { db } from '../db';
import bcrypt from 'bcryptjs';

interface CreateUserData {
  email: string;
  password: string;
  full_name?: string | null;
}

interface User {
  id: number;
  email: string;
  full_name: string | null;
  created_at: Date;
  updated_at: Date;
}

export const UserModel = {
  async create(userData: CreateUserData): Promise<User> {
    //HASH
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(userData.password, salt);
    
    //insert user into db
    const result = await db
      .insertInto('users')
      .values({
        email: userData.email,
        password: hashedPassword,
        full_name: userData.full_name || null,
      })
      .returning(['id', 'email', 'full_name', 'created_at', 'updated_at'])
      .executeTakeFirstOrThrow();
    
    return result;
  },
  
  async findByEmail(email: string): Promise<(User & { password: string }) | undefined> {
    const user = await db
      .selectFrom('users')
      .where('email', '=', email)
      .selectAll()
      .executeTakeFirst();
    
    return user;
  },
  
  async findById(id: number): Promise<User | undefined> {
    const user = await db
      .selectFrom('users')
      .where('id', '=', id)
      .select(['id', 'email', 'full_name', 'created_at', 'updated_at'])
      .executeTakeFirst();
    
    return user;
  },
  
  async updateLastLogin(userId: number): Promise<void> {
    await db
      .updateTable('users')
      .set({
        last_login: new Date().toISOString(),
      })
      .where('id', '=', userId)
      .execute();
  },
};