jest.mock('../../services/api.config', () => ({
  apiClient: {
    post: jest.fn(),
    get: jest.fn(),
  },
}));

import { authService, AuthResponse } from '../../services/auth.service';
import { apiClient } from '../../services/api.config';

const mockedApiClient = apiClient as unknown as {
  post: jest.Mock;
  get: jest.Mock;
};

describe('authService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('login posts to /auth/login and returns response.data', async () => {
    const credentials = { email: 'test@example.com', password: 'password' };
    const mockAuthResponse: AuthResponse = {
      status: 'success',
      message: 'Logged in',
      data: {
        user: {
          user_id: 1,
          username: 'tester',
          email: 'test@example.com',
        },
        token: 'jwt-token',
      },
    };
    mockedApiClient.post.mockResolvedValue({ data: mockAuthResponse });

    const result = await authService.login(credentials);

    expect(mockedApiClient.post).toHaveBeenCalledWith('/auth/login', credentials);
    expect(result).toEqual(mockAuthResponse);
  });

  it('register posts to /auth/register and returns response.data', async () => {
    const credentials = {
      username: 'newuser',
      email: 'new@example.com',
      password: 'newpass',
      device_token: 'device-123',
    };
    const mockAuthResponse: AuthResponse = {
      status: 'success',
      message: 'Registered',
      data: {
        user: {
          user_id: 2,
          username: 'newuser',
          email: 'new@example.com',
        },
        token: 'new-jwt-token',
      },
    };
    mockedApiClient.post.mockResolvedValue({ data: mockAuthResponse });

    const result = await authService.register(credentials);

    expect(mockedApiClient.post).toHaveBeenCalledWith('/auth/register', credentials);
    expect(result).toEqual(mockAuthResponse);
  });

  it('getMe sends Authorization header and returns response.data', async () => {
    const token = 'some-token';
    const mockData = { status: 'ok', foo: 'bar' };
    mockedApiClient.get.mockResolvedValue({ data: mockData });

    const result = await authService.getMe(token);

    expect(mockedApiClient.get).toHaveBeenCalledWith('/auth/me', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    expect(result).toEqual(mockData);
  });

  it('googleAuth posts to /auth/google and returns response.data', async () => {
    const payload = { idToken: 'google-id-token' };
    const mockAuthResponse: AuthResponse = {
      status: 'success',
      message: 'Google auth success',
      data: {
        user: {
          user_id: 3,
          username: 'googleuser',
          email: 'g@example.com',
        },
        token: 'google-jwt',
      },
    };
    mockedApiClient.post.mockResolvedValue({ data: mockAuthResponse });

    const result = await authService.googleAuth(payload);

    expect(mockedApiClient.post).toHaveBeenCalledWith('/auth/google', payload);
    expect(result).toEqual(mockAuthResponse);
  });
});
