jest.mock('../../services/api.config', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

import { apiClient } from '../../services/api.config';
import { userService } from '../../services/user.service';

describe('userService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('gets all users', async () => {
    (apiClient.get as jest.Mock).mockResolvedValue({ data: { status: 'success' } });

    await expect(userService.getAllUsers('token')).resolves.toEqual({ status: 'success' });
    expect(apiClient.get).toHaveBeenCalledWith('/chat/users', {
      headers: { Authorization: 'Bearer token' },
    });
  });

  it('gets a user by id', async () => {
    (apiClient.get as jest.Mock).mockResolvedValue({ data: { status: 'success' } });

    await userService.getUserById(4, 'token');
    expect(apiClient.get).toHaveBeenCalledWith('/users/4', {
      headers: { Authorization: 'Bearer token' },
    });
  });

  it('creates, updates, and deletes a user', async () => {
    (apiClient.post as jest.Mock).mockResolvedValue({ data: { status: 'success' } });
    (apiClient.put as jest.Mock).mockResolvedValue({ data: { status: 'success' } });
    (apiClient.delete as jest.Mock).mockResolvedValue({ data: { status: 'success' } });

    await userService.createUser(
      { username: 'alice', email: 'a@example.com', password: 'pw' },
      't',
    );
    await userService.updateUser(9, { username: 'bob' }, 't');
    await userService.deleteUser(9, 't');

    expect(apiClient.post).toHaveBeenCalledWith(
      '/users',
      { username: 'alice', email: 'a@example.com', password: 'pw' },
      { headers: { Authorization: 'Bearer t' } },
    );
    expect(apiClient.put).toHaveBeenCalledWith(
      '/users/9',
      { username: 'bob' },
      {
        headers: { Authorization: 'Bearer t' },
      },
    );
    expect(apiClient.delete).toHaveBeenCalledWith('/users/9', {
      headers: { Authorization: 'Bearer t' },
    });
  });

  it('gets and updates theme', async () => {
    (apiClient.get as jest.Mock).mockResolvedValue({ data: { status: 'success' } });
    (apiClient.put as jest.Mock).mockResolvedValue({ data: { status: 'success' } });

    await userService.getTheme('t');
    await userService.updateTheme('dark', 't');

    expect(apiClient.get).toHaveBeenCalledWith('/theme', {
      headers: { Authorization: 'Bearer t' },
    });
    expect(apiClient.put).toHaveBeenCalledWith(
      '/theme',
      { theme: 'dark' },
      { headers: { Authorization: 'Bearer t' } },
    );
  });

  it('calls feature flag endpoints', async () => {
    (apiClient.get as jest.Mock).mockResolvedValue({ data: { status: 'success' } });
    (apiClient.post as jest.Mock).mockResolvedValue({ data: { status: 'success' } });

    await userService.listFeatureFlags('t');
    await userService.getUsersWithFlags('t');
    await userService.setUserFeatureFlag(1, 'DARK_MODE', true, 't');
    await userService.setFeatureFlagForAllUsers('DARK_MODE', false, 't');
    await userService.rolloutFeatureFlagToPercentage('DARK_MODE', 40, 't');

    expect(apiClient.get).toHaveBeenNthCalledWith(1, '/users/feature-flags', {
      headers: { Authorization: 'Bearer t' },
    });
    expect(apiClient.get).toHaveBeenNthCalledWith(2, '/users/feature-flags/users', {
      headers: { Authorization: 'Bearer t' },
    });
    expect(apiClient.post).toHaveBeenNthCalledWith(
      1,
      '/users/feature-flags/DARK_MODE/users/1',
      { enabled: true },
      { headers: { Authorization: 'Bearer t' } },
    );
    expect(apiClient.post).toHaveBeenNthCalledWith(
      2,
      '/users/feature-flags/DARK_MODE/all',
      { enabled: false },
      { headers: { Authorization: 'Bearer t' } },
    );
    expect(apiClient.post).toHaveBeenNthCalledWith(
      3,
      '/users/feature-flags/DARK_MODE/rollout',
      { percentage: 40 },
      { headers: { Authorization: 'Bearer t' } },
    );
  });
});
