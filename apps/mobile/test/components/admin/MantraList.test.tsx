import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import MantraList from '../../../components/admin/MantraList';

// Mock Theme Context
jest.mock('../../../context/ThemeContext', () => ({
  useTheme: () => ({
    colors: {
      secondary: '#ff00ff',
      primaryDark: '#000033',
    },
  }),
}));

const fakeMantras = [
  {
    mantra_id: 1,
    title: 'Calm Breathing',
    key_takeaway: 'Relax and focus on the breath',
    created_at: '2023-01-01T00:00:00Z',
    is_active: true,
  },
  {
    mantra_id: 2,
    title: 'Positive Affirmations',
    key_takeaway: '',
    created_at: '2023-01-02T00:00:00Z',
    is_active: true,
  },
];

describe('MantraList component', () => {
  it('shows empty message if no mantras', () => {
    const { getByText } = render(
      <MantraList
        mantras={[]}
        loading={false}
        deletingId={null}
        onEdit={jest.fn()}
        onDelete={jest.fn()}
      />,
    );
    expect(getByText('No mantras available.')).toBeTruthy();
  });

  it('renders the list of mantras with edit/delete buttons', () => {
    const { getByText, getAllByText } = render(
      <MantraList
        mantras={fakeMantras}
        loading={false}
        deletingId={null}
        onEdit={jest.fn()}
        onDelete={jest.fn()}
      />,
    );

    expect(getByText('Calm Breathing')).toBeTruthy();
    expect(getByText('Relax and focus on the breath')).toBeTruthy();
    expect(getByText('Positive Affirmations')).toBeTruthy();
    expect(getAllByText('Edit').length).toBeGreaterThan(0);
    expect(getAllByText('Delete').length).toBeGreaterThan(0);
  });

  it('calls onEdit when Edit is pressed for a mantra', () => {
    const onEditMock = jest.fn();

    const { getAllByText } = render(
      <MantraList
        mantras={fakeMantras}
        loading={false}
        deletingId={null}
        onEdit={onEditMock}
        onDelete={jest.fn()}
      />,
    );

    // Multiple Edit buttons, pick the first
    fireEvent.press(getAllByText('Edit')[0]);
    expect(onEditMock).toHaveBeenCalledWith(fakeMantras[0]);
  });

  it('calls onDelete when Delete is pressed for a mantra', () => {
    const onDeleteMock = jest.fn();

    const { getAllByText } = render(
      <MantraList
        mantras={fakeMantras}
        loading={false}
        deletingId={null}
        onEdit={jest.fn()}
        onDelete={onDeleteMock}
      />,
    );

    fireEvent.press(getAllByText('Delete')[0]);
    expect(onDeleteMock).toHaveBeenCalledWith(fakeMantras[0].mantra_id, fakeMantras[0].title);
  });
});
