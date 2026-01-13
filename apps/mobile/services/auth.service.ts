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
  idToken: string;
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

export interface SimpleResponse {
  status: string;
  message: string;
  data?: any;
  waitTime?: number;
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

  async googleAuth({ idToken }: GoogleAuthCredentials): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/google', { idToken });
    return response.data;
  },

  async updateEmail(newEmail: string, token: string) {
    const response = await apiClient.patch(
      '/auth/email',
      { email: newEmail },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return response.data;
  },

  async updatePassword(newPassword: string, token: string) {
    const response = await apiClient.patch(
      '/auth/password',
      { password: newPassword },
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    return response.data;
  },

  async deleteAccount(token: string) {
    return apiClient.delete('/auth/account', {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  async forgotPassword(email: string): Promise<SimpleResponse> {
    const response = await apiClient.post<SimpleResponse>('/auth/forgot-password', { email });
    return response.data;
  },

  async verifyResetCode(email: string, code: string): Promise<SimpleResponse> {
    const response = await apiClient.post<SimpleResponse>('/auth/verify-code', { email, code });
    return response.data;
  },

  async resetPassword(email: string, code: string, newPassword: string): Promise<SimpleResponse> {
    const response = await apiClient.post<SimpleResponse>('/auth/reset-password', {
      email,
      code,
      newPassword,
    });
    return response.data;
  },
};
