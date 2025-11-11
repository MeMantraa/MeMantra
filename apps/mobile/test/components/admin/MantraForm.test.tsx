import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import MantraForm from '../../../components/admin/MantraForm';

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
  title: '',
  key_takeaway: '',
  background_author: '',
  background_description: '',
  jamie_take: '',
  when_where: '',
  negative_thoughts: '',
  cbt_principles: '',
  references: '',
};

describe('MantraForm component', () => {
  it('renders all TextInput fields and submit button', () => {
    const { getByPlaceholderText, getByText } = render(
      <MantraForm
        formData={baseFormData}
        onFormChange={jest.fn()}
        onSubmit={jest.fn()}
        submitting={false}
      />,
    );

    expect(getByText('Add a new mantra')).toBeTruthy();
    expect(getByPlaceholderText('Title *')).toBeTruthy();
    expect(getByPlaceholderText('Key Takeaway *')).toBeTruthy();
    expect(getByPlaceholderText('Background Author')).toBeTruthy();
    expect(getByPlaceholderText('Background Description')).toBeTruthy();
    expect(getByPlaceholderText("Jamie's Take")).toBeTruthy();
    expect(getByPlaceholderText('When & Where')).toBeTruthy();
    expect(getByPlaceholderText('Negative Thoughts It Replaces')).toBeTruthy();
    expect(getByPlaceholderText('CBT Principles')).toBeTruthy();
    expect(getByPlaceholderText('References')).toBeTruthy();
    expect(getByText('Add Mantra')).toBeTruthy();
  });

  it('renders Edit Mantra and Update Mantra when isEdit=true', () => {
    const { getByText } = render(
      <MantraForm
        formData={baseFormData}
        onFormChange={jest.fn()}
        onSubmit={jest.fn()}
        submitting={false}
        isEdit={true}
      />,
    );
    expect(getByText('Edit Mantra')).toBeTruthy();
    expect(getByText('Update Mantra')).toBeTruthy();
  });

  it('calls onFormChange when input values change', () => {
    const onFormChangeMock = jest.fn();

    const { getByPlaceholderText } = render(
      <MantraForm
        formData={baseFormData}
        onFormChange={onFormChangeMock}
        onSubmit={jest.fn()}
        submitting={false}
      />,
    );

    fireEvent.changeText(getByPlaceholderText('Title *'), 'testTitle');
    expect(onFormChangeMock).toHaveBeenCalledWith('title', 'testTitle');

    fireEvent.changeText(getByPlaceholderText('Key Takeaway *'), 'Takeaway');
    expect(onFormChangeMock).toHaveBeenCalledWith('key_takeaway', 'Takeaway');

    fireEvent.changeText(getByPlaceholderText('Background Author'), 'Author');
    expect(onFormChangeMock).toHaveBeenCalledWith('background_author', 'Author');

    fireEvent.changeText(getByPlaceholderText('Background Description'), 'Desc');
    expect(onFormChangeMock).toHaveBeenCalledWith('background_description', 'Desc');

    fireEvent.changeText(getByPlaceholderText("Jamie's Take"), 'Jamie Take');
    expect(onFormChangeMock).toHaveBeenCalledWith('jamie_take', 'Jamie Take');

    fireEvent.changeText(getByPlaceholderText('When & Where'), 'Where');
    expect(onFormChangeMock).toHaveBeenCalledWith('when_where', 'Where');

    fireEvent.changeText(getByPlaceholderText('Negative Thoughts It Replaces'), 'Negative');
    expect(onFormChangeMock).toHaveBeenCalledWith('negative_thoughts', 'Negative');

    fireEvent.changeText(getByPlaceholderText('CBT Principles'), 'CBT');
    expect(onFormChangeMock).toHaveBeenCalledWith('cbt_principles', 'CBT');

    fireEvent.changeText(getByPlaceholderText('References'), 'Refs');
    expect(onFormChangeMock).toHaveBeenCalledWith('references', 'Refs');
  });

  it('calls onSubmit when Add Mantra button is pressed', () => {
    const onSubmitMock = jest.fn();

    const { getByText } = render(
      <MantraForm
        formData={baseFormData}
        onFormChange={jest.fn()}
        onSubmit={onSubmitMock}
        submitting={false}
      />,
    );

    fireEvent.press(getByText('Add Mantra'));
    expect(onSubmitMock).toHaveBeenCalled();
  });

  it('disables input fields and shows ActivityIndicator when submitting', () => {
    const { getByPlaceholderText, getByTestId, queryByText } = render(
      <MantraForm
        formData={baseFormData}
        onFormChange={jest.fn()}
        onSubmit={jest.fn()}
        submitting={true}
      />,
    );

    // All inputs should be disabled
    expect(getByPlaceholderText('Title *').props.editable).toBe(false);
    expect(getByPlaceholderText('Key Takeaway *').props.editable).toBe(false);

    // Button shows ActivityIndicator, not "Add Mantra" text
    expect(queryByText('Add Mantra')).toBeNull();
  });
});
