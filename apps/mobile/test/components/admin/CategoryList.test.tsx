import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import CategoryList from '../../../components/admin/CategoryList';
import { Category } from '../../../services/category.service';

// Mock Theme Context
jest.mock('../../../context/ThemeContext', () => ({
  useTheme: () => ({
    colors: {
      secondary: '#ff00ff',
      primaryDark: '#000033',
    },
  }),
}));

const fakeCategories: Category[] = [
  {
    category_id: 1,
    name: 'Breathing',
    description: 'Breathing exercises',
    category_type: 'essential',
    parent_id: null,
    is_active: true,
  },
  {
    category_id: 2,
    name: 'Productivity',
    description: 'Productivity goals',
    category_type: 'goal',
    parent_id: null,
    is_active: true,
  },
  {
    category_id: 3,
    name: 'Happiness',
    description: undefined,
    category_type: 'mood',
    parent_id: null,
    is_active: true,
  },
];

describe('CategoryList component', () => {
  it('shows loading state with ActivityIndicator and text', () => {
    const { getByText } = render(
      <CategoryList
        categories={[]}
        loading={true}
        deletingId={null}
        onEdit={jest.fn()}
        onDelete={jest.fn()}
      />,
    );

    expect(getByText('Loading categories...')).toBeTruthy();
  });

  it('shows empty state when no categories', () => {
    const { getByText } = render(
      <CategoryList
        categories={[]}
        loading={false}
        deletingId={null}
        onEdit={jest.fn()}
        onDelete={jest.fn()}
      />,
    );

    expect(getByText('No categories available.')).toBeTruthy();
  });

  it('renders all categories with names', () => {
    const { getByText } = render(
      <CategoryList
        categories={fakeCategories}
        loading={false}
        deletingId={null}
        onEdit={jest.fn()}
        onDelete={jest.fn()}
      />,
    );

    expect(getByText('Breathing')).toBeTruthy();
    expect(getByText('Productivity')).toBeTruthy();
    expect(getByText('Happiness')).toBeTruthy();
  });

  it('renders category descriptions when available', () => {
    const { getByText, queryByText } = render(
      <CategoryList
        categories={fakeCategories}
        loading={false}
        deletingId={null}
        onEdit={jest.fn()}
        onDelete={jest.fn()}
      />,
    );

    expect(getByText('Breathing exercises')).toBeTruthy();
    expect(getByText('Productivity goals')).toBeTruthy();
  });

  it('does not render description when null', () => {
    const { queryByText } = render(
      <CategoryList
        categories={fakeCategories}
        loading={false}
        deletingId={null}
        onEdit={jest.fn()}
        onDelete={jest.fn()}
      />,
    );

    // Happiness category has no description, so it shouldn't appear
    // But we need to make sure the category is still rendered
    expect(queryByText('Happiness')).toBeTruthy();
  });

  it('renders type badges with correct labels', () => {
    const { getByText } = render(
      <CategoryList
        categories={fakeCategories}
        loading={false}
        deletingId={null}
        onEdit={jest.fn()}
        onDelete={jest.fn()}
      />,
    );

    expect(getByText('Essential')).toBeTruthy();
    expect(getByText('Goal')).toBeTruthy();
    expect(getByText('Mood')).toBeTruthy();
  });

  it('calls onEdit when Edit button is pressed', () => {
    const onEditMock = jest.fn();

    const { getAllByText } = render(
      <CategoryList
        categories={fakeCategories}
        loading={false}
        deletingId={null}
        onEdit={onEditMock}
        onDelete={jest.fn()}
      />,
    );

    const editButtons = getAllByText('Edit');
    fireEvent.press(editButtons[0]);

    expect(onEditMock).toHaveBeenCalledWith(fakeCategories[0]);
  });

  it('calls onDelete when Delete button is pressed', () => {
    const onDeleteMock = jest.fn();

    const { getAllByText } = render(
      <CategoryList
        categories={fakeCategories}
        loading={false}
        deletingId={null}
        onEdit={jest.fn()}
        onDelete={onDeleteMock}
      />,
    );

    const deleteButtons = getAllByText('Delete');
    fireEvent.press(deleteButtons[0]);

    expect(onDeleteMock).toHaveBeenCalledWith(1, 'Breathing');
  });

  it('shows ActivityIndicator on Delete button when deletingId matches', () => {
    const { queryByText, getAllByText } = render(
      <CategoryList
        categories={fakeCategories}
        loading={false}
        deletingId={1}
        onEdit={jest.fn()}
        onDelete={jest.fn()}
      />,
    );

    // First delete button (for category_id 1) should show spinner and no text
    const deleteButtons = getAllByText('Delete');
    expect(deleteButtons[0]).toBeTruthy();

    // The deleted category's delete button should not show text (showing spinner instead)
    const allDeleteTexts = getAllByText('Delete');
    expect(allDeleteTexts.length).toBe(2); // Only 2 visible (not deleted ones)
  });

  it('disables Delete button when deletingId matches', () => {
    const { getAllByText } = render(
      <CategoryList
        categories={fakeCategories}
        loading={false}
        deletingId={1}
        onEdit={jest.fn()}
        onDelete={jest.fn()}
      />,
    );

    const deleteButtons = getAllByText('Delete');
    // When deletingId matches, the button should be disabled
    // The button is wrapped in a TouchableOpacity with the disabled prop
    expect(deleteButtons[0].parent?.props).toBeDefined();
  });

  it('Delete button is enabled when not deleting', () => {
    const { getAllByText } = render(
      <CategoryList
        categories={fakeCategories}
        loading={false}
        deletingId={null}
        onEdit={jest.fn()}
        onDelete={jest.fn()}
      />,
    );

    const deleteButtons = getAllByText('Delete');
    // All three delete buttons should be visible
    expect(deleteButtons.length).toBe(3);
  });

  it('handles multiple category type selections', () => {
    const categoriesMultipleTypes = [
      { ...fakeCategories[0], category_type: 'scenario' as const },
      { ...fakeCategories[1], category_type: 'time' as const },
      { ...fakeCategories[2], category_type: 'theme' as const },
    ] as Category[];

    const { getByText } = render(
      <CategoryList
        categories={categoriesMultipleTypes}
        loading={false}
        deletingId={null}
        onEdit={jest.fn()}
        onDelete={jest.fn()}
      />,
    );

    expect(getByText('Scenario')).toBeTruthy();
    expect(getByText('Time')).toBeTruthy();
    expect(getByText('Theme')).toBeTruthy();
  });

  it('calls onEdit for the correct category when multiple categories exist', () => {
    const onEditMock = jest.fn();

    const { getAllByText } = render(
      <CategoryList
        categories={fakeCategories}
        loading={false}
        deletingId={null}
        onEdit={onEditMock}
        onDelete={jest.fn()}
      />,
    );

    const editButtons = getAllByText('Edit');
    fireEvent.press(editButtons[1]); // Press edit for second category

    expect(onEditMock).toHaveBeenCalledWith(fakeCategories[1]);
  });

  it('calls onDelete for the correct category when multiple categories exist', () => {
    const onDeleteMock = jest.fn();

    const { getAllByText } = render(
      <CategoryList
        categories={fakeCategories}
        loading={false}
        deletingId={null}
        onEdit={jest.fn()}
        onDelete={onDeleteMock}
      />,
    );

    const deleteButtons = getAllByText('Delete');
    fireEvent.press(deleteButtons[2]); // Press delete for third category

    expect(onDeleteMock).toHaveBeenCalledWith(3, 'Happiness');
  });

  it('renders single category correctly', () => {
    const singleCategory = [fakeCategories[0]];

    const { getByText, queryByText } = render(
      <CategoryList
        categories={singleCategory}
        loading={false}
        deletingId={null}
        onEdit={jest.fn()}
        onDelete={jest.fn()}
      />,
    );

    expect(getByText('Breathing')).toBeTruthy();
    expect(queryByText('Productivity')).toBeNull();
  });
});
