import { apiClient } from './api.config';

export interface User {
  user_id: number;
  username: string | null;
  email: string | null;
  auth_provider?: string;
  created_at: string;
}

export interface CreateUserPayload {
  username: string;
  email: string;
  password: string;
}

export interface UpdateUserPayload {
  username?: string;
  email?: string;
  password?: string;
}

export interface UsersResponse {
  status: string;
  message?: string;
  data: { users: User[] };
}

export interface UserDetailResponse {
  status: string;
  message?: string;
  data: { user: User };
}

export interface UserMutationResponse {
  status: string;
  message?: string;
}

export const userService = {
  async getAllUsers(token: string): Promise<UsersResponse> {
    const response = await apiClient.get<UsersResponse>('/users', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  async getUserById(userId: number, token: string): Promise<UserDetailResponse> {
    const response = await apiClient.get<UserDetailResponse>(`/users/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  async createUser(userData: CreateUserPayload, token: string): Promise<UserDetailResponse> {
    const response = await apiClient.post<UserDetailResponse>('/users', userData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  async updateUser(
    userId: number,
    userData: UpdateUserPayload,
    token: string,
  ): Promise<UserDetailResponse> {
    const response = await apiClient.put<UserDetailResponse>(`/users/${userId}`, userData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  async deleteUser(userId: number, token: string): Promise<UserMutationResponse> {
    const response = await apiClient.delete<UserMutationResponse>(`/users/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },
};
