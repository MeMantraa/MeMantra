import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import UserForm from '../../../components/admin/UserForm';

// Mock Theme Context
jest.mock('../../../context/ThemeContext', () => ({
  useTheme: () => ({
    colors: {
      secondary: '#ff00ff',
      primaryDark: '#000033',
    },
  }),
}));

const baseFormData = {
  username: '',
  email: '',
  password: '',
};

describe('UserForm component', () => {
  it('renders all TextInput fields and the submit button', () => {
    const { getByPlaceholderText, getByText } = render(
      <UserForm
        formData={baseFormData}
        onFormChange={jest.fn()}
        onSubmit={jest.fn()}
        submitting={false}
      />,
    );

    expect(getByText('Add a new user')).toBeTruthy();
    expect(getByPlaceholderText('Username *')).toBeTruthy();
    expect(getByPlaceholderText('Email *')).toBeTruthy();
    expect(getByPlaceholderText('Password *')).toBeTruthy();
    expect(getByText('Add User')).toBeTruthy();
  });

  it('renders Edit User and Update User when isEdit=true', () => {
    const { getByText, getByPlaceholderText } = render(
      <UserForm
        formData={baseFormData}
        onFormChange={jest.fn()}
        onSubmit={jest.fn()}
        submitting={false}
        isEdit={true}
      />,
    );
    expect(getByText('Edit User')).toBeTruthy();
    expect(getByText('Update User')).toBeTruthy();
    expect(getByPlaceholderText('Password (leave empty to keep current)')).toBeTruthy();
  });

  it('calls onFormChange when input values change', () => {
    const onFormChangeMock = jest.fn();

    const { getByPlaceholderText } = render(
      <UserForm
        formData={baseFormData}
        onFormChange={onFormChangeMock}
        onSubmit={jest.fn()}
        submitting={false}
      />,
    );

    fireEvent.changeText(getByPlaceholderText('Username *'), 'steve');
    expect(onFormChangeMock).toHaveBeenCalledWith('username', 'steve');

    fireEvent.changeText(getByPlaceholderText('Email *'), 'steve@email.com');
    expect(onFormChangeMock).toHaveBeenCalledWith('email', 'steve@email.com');

    fireEvent.changeText(getByPlaceholderText('Password *'), 'secret');
    expect(onFormChangeMock).toHaveBeenCalledWith('password', 'secret');
  });

  it('calls onFormChange for edit password field', () => {
    const onFormChangeMock = jest.fn();
    const { getByPlaceholderText } = render(
      <UserForm
        formData={baseFormData}
        onFormChange={onFormChangeMock}
        onSubmit={jest.fn()}
        submitting={false}
        isEdit={true}
      />,
    );
    fireEvent.changeText(
      getByPlaceholderText('Password (leave empty to keep current)'),
      'newsecret',
    );
    expect(onFormChangeMock).toHaveBeenCalledWith('password', 'newsecret');
  });

  it('calls onSubmit when Add User button is pressed', () => {
    const onSubmitMock = jest.fn();
    const { getByText } = render(
      <UserForm
        formData={baseFormData}
        onFormChange={jest.fn()}
        onSubmit={onSubmitMock}
        submitting={false}
      />,
    );
    fireEvent.press(getByText('Add User'));
    expect(onSubmitMock).toHaveBeenCalled();
  });
});
