import { authService } from '../../services/auth.service';

const mockPost = jest.fn();
const mockGet = jest.fn();

jest.mock('../../services/api.config', () => ({
  apiClient: {
    post: (...args: unknown[]) => mockPost(...args),
    get: (...args: unknown[]) => mockGet(...args),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
  },
}));

describe('authService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls the login endpoint and returns the response data', async () => {
    const payload = { email: 'user@example.com', password: 'secret' };
    const data = { status: 'success' };
    mockPost.mockResolvedValueOnce({ data });

    const result = await authService.login(payload);

    expect(mockPost).toHaveBeenCalledWith('/auth/login', payload);
    expect(result).toBe(data);
  });

  it('calls the register endpoint and returns the response data', async () => {
    const payload = { username: 'newuser', email: 'new@example.com', password: 'pass123' };
    const data = { status: 'success' };
    mockPost.mockResolvedValueOnce({ data });

    const result = await authService.register(payload);

    expect(mockPost).toHaveBeenCalledWith('/auth/register', payload);
    expect(result).toBe(data);
  });

  it('calls the getMe endpoint with the provided token', async () => {
    const data = { status: 'success' };
    mockGet.mockResolvedValueOnce({ data });

    const result = await authService.getMe('jwt-token');

    expect(mockGet).toHaveBeenCalledWith('/auth/me', {
      headers: { Authorization: 'Bearer jwt-token' },
    });
    expect(result).toBe(data);
  });

  it('calls the googleAuth endpoint and returns the response data', async () => {
    const data = { status: 'success' };
    mockPost.mockResolvedValueOnce({ data });

    const result = await authService.googleAuth({ idToken: 'google-token' });

    expect(mockPost).toHaveBeenCalledWith('/auth/google', { idToken: 'google-token' });
    expect(result).toBe(data);
  });
});
