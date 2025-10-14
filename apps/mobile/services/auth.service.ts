import { apiClient } from './api.config';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  username: string;
  email: string;
  password: string;
  device_token?: string;
}

export interface GoogleAuthCredentials {
  email: string;
  name: string;
  googleId: string;
}

export interface AuthResponse {
  status: string;
  message: string;
  data: {
    user: {
      user_id: number;
      username: string | null;
      email: string | null;
    };
    token: string;
  };
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/login', credentials);
    return response.data;
  },

  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/register', credentials);
    return response.data;
  },

  async getMe(token: string) {
    const response = await apiClient.get('/auth/me', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  },

  async googleAuth(credentials: GoogleAuthCredentials): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/google', credentials);
    return response.data;
  },
};
