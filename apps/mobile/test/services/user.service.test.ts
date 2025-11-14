// ---- Mock Setup ----
const INITIAL_USERS = [
  {
    user_id: 1,
    username: 'alice',
    email: 'alice@email.com',
    auth_provider: 'local',
    created_at: new Date().toISOString(),
  },
  {
    user_id: 2,
    username: 'bob',
    email: 'bob@email.com',
    auth_provider: 'local',
    created_at: new Date().toISOString(),
  },
];

let mockUserState: { users: typeof INITIAL_USERS };

function resetUserState() {
  mockUserState = {
    users: INITIAL_USERS.map((u) => ({ ...u })),
  };
}

jest.mock('../../services/api.config', () => ({
  apiClient: {
    get: jest.fn((url: string) => {
      const { users } = mockUserState;
      if (url === '/users') {
        return Promise.resolve({
          data: {
            status: 'success',
            data: { users },
          },
        });
      }
      if (url.startsWith('/users/')) {
        const id = Number(url.split('/').pop());
        const user = users.find((u) => u.user_id === id);
        if (user) {
          return Promise.resolve({
            data: {
              status: 'success',
              data: { user },
            },
          });
        } else {
          return Promise.resolve({
            data: {
              status: 'error',
              message: 'User not found',
              data: { user: null },
            },
          });
        }
      }
      return Promise.resolve({ data: {} });
    }),
    post: jest.fn((url: string, body: any) => {
      const { users } = mockUserState;
      if (url === '/users') {
        const nextId = users.length ? Math.max(...users.map((u) => u.user_id)) + 1 : 1;
        const newUser = {
          user_id: nextId,
          username: body.username,
          email: body.email,
          created_at: new Date().toISOString(),
          auth_provider: 'local',
        };
        mockUserState.users = [...users, newUser];
        return Promise.resolve({
          data: {
            status: 'success',
            data: { user: newUser },
          },
        });
      }
      return Promise.resolve({ data: {} });
    }),
    put: jest.fn((url: string, body: any) => {
      const { users } = mockUserState;
      if (url.startsWith('/users/')) {
        const id = Number(url.split('/').pop());
        let updatedUser = null;
        mockUserState.users = users.map((u) => {
          if (u.user_id === id) {
            updatedUser = { ...u, ...body };
            return updatedUser;
          }
          return u;
        });
        return Promise.resolve({
          data: {
            status: 'success',
            data: { user: updatedUser },
          },
        });
      }
      return Promise.resolve({ data: {} });
    }),
    delete: jest.fn((url: string) => {
      const { users } = mockUserState;
      if (url.startsWith('/users/')) {
        const id = Number(url.split('/').pop());
        const exists = users.some((u) => u.user_id === id);
        if (exists) {
          mockUserState.users = users.filter((u) => u.user_id !== id);
          return Promise.resolve({
            data: {
              status: 'success',
              message: 'User deleted successfully',
            },
          });
        } else {
          return Promise.resolve({
            data: {
              status: 'error',
              message: 'User not found',
            },
          });
        }
      }
      return Promise.resolve({ data: {} });
    }),
  },
}));

import { userService } from '../../services/user.service';

describe('userService (mock implementation)', () => {
  beforeEach(() => {
    resetUserState();
    jest.resetModules();
  });

  it('gets all users', async () => {
    const response = await userService.getAllUsers('token');
    expect(response.status).toBe('success');
    expect(response.data.users).toBeInstanceOf(Array);
    expect(response.data.users.length).toBe(2);
    expect(response.data.users[0].username).toBe('alice');
    expect(response.data.users[1].username).toBe('bob');
  });

  it('gets user by ID', async () => {
    const response = await userService.getUserById(1, 'token');
    expect(response.status).toBe('success');
    expect(response.data.user).toBeTruthy();
    expect(response.data.user.username).toBe('alice');
  });

  it('returns error for missing user', async () => {
    const response = await userService.getUserById(99, 'token');
    expect(response.status).toBe('error');
    expect(response.message).toBe('User not found');
    expect(response.data.user).toBeNull();
  });

  it('creates a new user', async () => {
    const newUserData = { username: 'charlie', email: 'charlie@email.com', password: '1234' };
    const response = await userService.createUser(newUserData, 'token');
    expect(response.status).toBe('success');
    expect(response.data.user).toBeTruthy();
    expect(response.data.user.username).toBe('charlie');

    const allUsers = await userService.getAllUsers('token');
    expect(allUsers.data.users.find((u) => u.username === 'charlie')).toBeTruthy();
  });

  it('updates an existing user', async () => {
    const updatedData = { email: 'alice@newmail.com' };
    const response = await userService.updateUser(1, updatedData, 'token');
    expect(response.status).toBe('success');
    expect(response.data.user.email).toBe('alice@newmail.com');

    const checkUser = await userService.getUserById(1, 'token');
    expect(checkUser.data.user.email).toBe('alice@newmail.com');
  });

  it('deletes an existing user', async () => {
    const response = await userService.deleteUser(1, 'token');
    expect(response.status).toBe('success');
    expect(response.message).toBe('User deleted successfully');

    const allUsers = await userService.getAllUsers('token');
    expect(allUsers.data.users.find((u) => u.user_id === 1)).toBeUndefined();
  });

  it('returns error when deleting unknown user', async () => {
    const response = await userService.deleteUser(99, 'token');
    expect(response.status).toBe('error');
    expect(response.message).toBe('User not found');
  });
});
