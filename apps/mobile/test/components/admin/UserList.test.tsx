import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import UserList from '../../../components/admin/UserList';

// Mock Theme Context
jest.mock('../../../context/ThemeContext', () => ({
  useTheme: () => ({
    colors: {
      secondary: '#ff00ff',
      primaryDark: '#000033',
    },
  }),
}));

const testUsers = [
  {
    user_id: 1,
    username: 'alice',
    email: 'alice@example.com',
    auth_provider: 'local',
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    user_id: 2,
    username: 'bob',
    email: 'bob@example.com',
    auth_provider: '',
    created_at: '2024-01-02T00:00:00Z',
  },
];

describe('UserList', () => {
  it('shows empty message when no users', () => {
    const { getByText } = render(
      <UserList
        users={[]}
        loading={false}
        deletingId={null}
        onEdit={jest.fn()}
        onDelete={jest.fn()}
      />,
    );
    expect(getByText('No users available.')).toBeTruthy();
  });

  it('renders the list of users with edit/delete buttons', () => {
    const { getByText, getAllByText } = render(
      <UserList
        users={testUsers}
        loading={false}
        deletingId={null}
        onEdit={jest.fn()}
        onDelete={jest.fn()}
      />,
    );
    expect(getByText('alice')).toBeTruthy();
    expect(getByText('bob')).toBeTruthy();
    expect(getByText('alice@example.com')).toBeTruthy();
    expect(getByText('bob@example.com')).toBeTruthy();
    expect(getByText('Provider: local')).toBeTruthy();
    expect(getAllByText('Edit').length).toBeGreaterThan(0);
    expect(getAllByText('Delete').length).toBeGreaterThan(0);
  });

  it('calls onEdit when Edit is pressed for a user', () => {
    const onEditMock = jest.fn();
    const { getAllByText } = render(
      <UserList
        users={testUsers}
        loading={false}
        deletingId={null}
        onEdit={onEditMock}
        onDelete={jest.fn()}
      />,
    );
    fireEvent.press(getAllByText('Edit')[0]);
    expect(onEditMock).toHaveBeenCalledWith(testUsers[0]);
  });

  it('calls onDelete when Delete is pressed for a user', () => {
    const onDeleteMock = jest.fn();
    const { getAllByText } = render(
      <UserList
        users={testUsers}
        loading={false}
        deletingId={null}
        onEdit={jest.fn()}
        onDelete={onDeleteMock}
      />,
    );
    fireEvent.press(getAllByText('Delete')[1]);
    expect(onDeleteMock).toHaveBeenCalledWith(testUsers[1].user_id, testUsers[1].username);
  });
});
