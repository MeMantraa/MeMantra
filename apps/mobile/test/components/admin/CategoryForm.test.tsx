import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import CategoryForm from '../../../components/admin/CategoryForm';

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
  name: '',
  description: '',
  category_type: '',
};

describe('CategoryForm component', () => {
  it('renders all inputs and submit button in add mode', () => {
    const { getByPlaceholderText, getByText } = render(
      <CategoryForm
        formData={baseFormData}
        onFormChange={jest.fn()}
        onSubmit={jest.fn()}
        submitting={false}
      />,
    );

    expect(getByText('Add a new category')).toBeTruthy();
    expect(getByPlaceholderText('Category Name *')).toBeTruthy();
    expect(getByPlaceholderText('Description')).toBeTruthy();
    expect(getByText('Category Layer')).toBeTruthy();
    expect(getByText('Add Category')).toBeTruthy();
  });

  it('renders all category type chips', () => {
    const { getByText } = render(
      <CategoryForm
        formData={baseFormData}
        onFormChange={jest.fn()}
        onSubmit={jest.fn()}
        submitting={false}
      />,
    );

    expect(getByText('Essentials')).toBeTruthy();
    expect(getByText('Goals')).toBeTruthy();
    expect(getByText('Moods')).toBeTruthy();
    expect(getByText('Life Scenarios')).toBeTruthy();
    expect(getByText('Times')).toBeTruthy();
    expect(getByText('Themes')).toBeTruthy();
  });

  it('renders Edit Category and Update Category buttons when isEdit=true', () => {
    const { getByText } = render(
      <CategoryForm
        formData={baseFormData}
        onFormChange={jest.fn()}
        onSubmit={jest.fn()}
        submitting={false}
        isEdit={true}
      />,
    );

    expect(getByText('Edit Category')).toBeTruthy();
    expect(getByText('Update Category')).toBeTruthy();
  });

  it('calls onFormChange when name input changes', () => {
    const onFormChangeMock = jest.fn();

    const { getByPlaceholderText } = render(
      <CategoryForm
        formData={baseFormData}
        onFormChange={onFormChangeMock}
        onSubmit={jest.fn()}
        submitting={false}
      />,
    );

    fireEvent.changeText(getByPlaceholderText('Category Name *'), 'Breathing');
    expect(onFormChangeMock).toHaveBeenCalledWith('name', 'Breathing');
  });

  it('calls onFormChange when description input changes', () => {
    const onFormChangeMock = jest.fn();

    const { getByPlaceholderText } = render(
      <CategoryForm
        formData={baseFormData}
        onFormChange={onFormChangeMock}
        onSubmit={jest.fn()}
        submitting={false}
      />,
    );

    fireEvent.changeText(getByPlaceholderText('Description'), 'Breathing techniques');
    expect(onFormChangeMock).toHaveBeenCalledWith('description', 'Breathing techniques');
  });

  it('calls onFormChange when category type chip is selected', () => {
    const onFormChangeMock = jest.fn();

    const { getByText } = render(
      <CategoryForm
        formData={baseFormData}
        onFormChange={onFormChangeMock}
        onSubmit={jest.fn()}
        submitting={false}
      />,
    );

    fireEvent.press(getByText('Essentials'));
    expect(onFormChangeMock).toHaveBeenCalledWith('category_type', 'essential');
  });

  it('deselects category type when same chip is pressed again', () => {
    const onFormChangeMock = jest.fn();

    const { getByText } = render(
      <CategoryForm
        formData={{ ...baseFormData, category_type: 'essential' }}
        onFormChange={onFormChangeMock}
        onSubmit={jest.fn()}
        submitting={false}
      />,
    );

    fireEvent.press(getByText('Essentials'));
    expect(onFormChangeMock).toHaveBeenCalledWith('category_type', '');
  });

  it('calls onSubmit when Add Category button is pressed', () => {
    const onSubmitMock = jest.fn();

    const { getByText } = render(
      <CategoryForm
        formData={baseFormData}
        onFormChange={jest.fn()}
        onSubmit={onSubmitMock}
        submitting={false}
      />,
    );

    fireEvent.press(getByText('Add Category'));
    expect(onSubmitMock).toHaveBeenCalled();
  });

  it('calls onSubmit when Update Category button is pressed', () => {
    const onSubmitMock = jest.fn();

    const { getByText } = render(
      <CategoryForm
        formData={baseFormData}
        onFormChange={jest.fn()}
        onSubmit={onSubmitMock}
        submitting={false}
        isEdit={true}
      />,
    );

    fireEvent.press(getByText('Update Category'));
    expect(onSubmitMock).toHaveBeenCalled();
  });

  it('disables input fields when submitting', () => {
    const { getByPlaceholderText } = render(
      <CategoryForm
        formData={baseFormData}
        onFormChange={jest.fn()}
        onSubmit={jest.fn()}
        submitting={true}
      />,
    );

    expect(getByPlaceholderText('Category Name *').props.editable).toBe(false);
    expect(getByPlaceholderText('Description').props.editable).toBe(false);
  });

  it('shows ActivityIndicator when submitting', () => {
    const { queryByText } = render(
      <CategoryForm
        formData={baseFormData}
        onFormChange={jest.fn()}
        onSubmit={jest.fn()}
        submitting={true}
      />,
    );

    // Button text should not be visible
    expect(queryByText('Add Category')).toBeNull();
  });

  it('allows toggling category type selection', () => {
    const onFormChangeMock = jest.fn();

    const { getByText } = render(
      <CategoryForm
        formData={{ ...baseFormData, category_type: 'goal' }}
        onFormChange={onFormChangeMock}
        onSubmit={jest.fn()}
        submitting={false}
      />,
    );

    const goalsButton = getByText('Goals');
    // Verify that the button exists and is rendered
    expect(goalsButton).toBeTruthy();
    // Deselect by clicking it
    fireEvent.press(goalsButton);
    expect(onFormChangeMock).toHaveBeenCalledWith('category_type', '');
  });

  it('allows multiple field changes in sequence', () => {
    const onFormChangeMock = jest.fn();

    const { getByPlaceholderText, getByText } = render(
      <CategoryForm
        formData={baseFormData}
        onFormChange={onFormChangeMock}
        onSubmit={jest.fn()}
        submitting={false}
      />,
    );

    fireEvent.changeText(getByPlaceholderText('Category Name *'), 'Productivity');
    fireEvent.changeText(getByPlaceholderText('Description'), 'Work and productivity');
    fireEvent.press(getByText('Goals'));

    expect(onFormChangeMock).toHaveBeenCalledWith('name', 'Productivity');
    expect(onFormChangeMock).toHaveBeenCalledWith('description', 'Work and productivity');
    expect(onFormChangeMock).toHaveBeenCalledWith('category_type', 'goal');
  });
});
