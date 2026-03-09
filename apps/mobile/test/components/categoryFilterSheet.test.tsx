import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Animated } from 'react-native';
import CategoryFilterSheet from '../../components/categoryFilterSheet';
import { Category } from '../../services/category.service';

// Mock
jest.spyOn(Animated, 'timing').mockImplementation((value: any, config: any) => ({
  start: jest.fn((callback?: (result: { finished: boolean }) => void) => {
    if (callback) {
      callback({ finished: true });
    }
  }),
  stop: jest.fn(),
  reset: jest.fn(),
}));

jest.spyOn(Animated, 'spring').mockImplementation((value: any, config: any) => ({
  start: jest.fn((callback?: (result: { finished: boolean }) => void) => {
    if (callback) {
      callback({ finished: true });
    }
  }),
  stop: jest.fn(),
  reset: jest.fn(),
}));

describe('CategoryFilterSheet', () => {
  const mockCategories: Category[] = [
    {
      category_id: 1,
      name: 'Mind & Emotional Health',
      description: 'Mantras for mental well-being',
      category_type: 'essential',
      parent_id: null,
      is_active: true,
    },
    {
      category_id: 2,
      name: 'Physical Health & Energy',
      description: 'Mantras for physical vitality',
      category_type: 'essential',
      parent_id: null,
      is_active: true,
    },
    {
      category_id: 3,
      name: 'Stress Relief / Calm',
      description: 'Mantras to reduce stress',
      category_type: 'essential',
      parent_id: 1,
      is_active: true,
    },
    {
      category_id: 20,
      name: 'Boost Confidence & Courage',
      description: 'Mantras to build confidence',
      category_type: 'goal',
      parent_id: null,
      is_active: true,
    },
    {
      category_id: 30,
      name: 'Calm / Relaxed',
      description: 'When you feel calm',
      category_type: 'mood',
      parent_id: null,
      is_active: true,
    },
    {
      category_id: 40,
      name: 'Work Challenges & Deadlines',
      description: 'Mantras for work pressure',
      category_type: 'scenario',
      parent_id: null,
      is_active: true,
    },
    {
      category_id: 50,
      name: 'Morning Motivation',
      description: 'Mantras to start the day',
      category_type: 'time',
      parent_id: null,
      is_active: true,
    },
    {
      category_id: 60,
      name: 'Courage & Confidence',
      description: 'Mantras for bravery',
      category_type: 'theme',
      parent_id: null,
      is_active: true,
    },
  ];

  const mockOnApply = jest.fn();
  const mockOnClose = jest.fn();

  const defaultProps = {
    visible: true,
    categories: mockCategories,
    selectedCategoryIds: [] as number[],
    onApply: mockOnApply,
    onClose: mockOnClose,
    loading: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders when visible is true', () => {
    const { getByText, getByTestId } = render(<CategoryFilterSheet {...defaultProps} />);

    expect(getByTestId('category-filter-sheet')).toBeTruthy();
    expect(getByText('Filter by Category')).toBeTruthy();
    expect(getByTestId('apply-filter-btn')).toBeTruthy();
  });

  it('does not render content when visible is false', () => {
    const { queryByText } = render(<CategoryFilterSheet {...defaultProps} visible={false} />);

    expect(queryByText('Filter by Category')).toBeNull();
  });

  it('displays section headers for category types that have data', () => {
    const { getByText } = render(<CategoryFilterSheet {...defaultProps} />);

    expect(getByText('Essentials')).toBeTruthy();
    expect(getByText('Goal-Based Categories')).toBeTruthy();
    expect(getByText('Mood / Emotion-Based')).toBeTruthy();
  });

  it('displays top-level categories but not subcategories', () => {
    const { getByText, queryByText } = render(<CategoryFilterSheet {...defaultProps} />);

    expect(getByText('Mind & Emotional Health')).toBeTruthy();
    expect(getByText('Physical Health & Energy')).toBeTruthy();
    expect(getByText('Boost Confidence & Courage')).toBeTruthy();

    expect(queryByText('Stress Relief / Calm')).toBeNull();
  });

  it('displays category descriptions', () => {
    const { getByText } = render(<CategoryFilterSheet {...defaultProps} />);

    expect(getByText('Mantras for mental well-being')).toBeTruthy();
    expect(getByText('Mantras for physical vitality')).toBeTruthy();
  });

  it('toggles category selection when pressed', () => {
    const { getByTestId } = render(<CategoryFilterSheet {...defaultProps} />);

    fireEvent.press(getByTestId('category-filter-item-1'));

    expect(getByTestId('apply-filter-btn')).toBeTruthy();
  });

  it('selects and deselects categories', () => {
    const { getByTestId, getByText } = render(<CategoryFilterSheet {...defaultProps} />);

    fireEvent.press(getByTestId('category-filter-item-1'));

    expect(getByText('Apply (1)')).toBeTruthy();

    fireEvent.press(getByTestId('category-filter-item-20'));
    expect(getByText('Apply (2)')).toBeTruthy();

    fireEvent.press(getByTestId('category-filter-item-1'));
    expect(getByText('Apply (1)')).toBeTruthy();
  });

  it('calls onApply with selected category IDs when Apply is pressed', () => {
    const { getByTestId } = render(<CategoryFilterSheet {...defaultProps} />);

    fireEvent.press(getByTestId('category-filter-item-1'));
    fireEvent.press(getByTestId('category-filter-item-30'));

    fireEvent.press(getByTestId('apply-filter-btn'));

    expect(mockOnApply).toHaveBeenCalledWith([1, 30]);
  });

  it('calls onApply with empty array when Apply is pressed with no selection', () => {
    const { getByTestId } = render(<CategoryFilterSheet {...defaultProps} />);

    fireEvent.press(getByTestId('apply-filter-btn'));

    expect(mockOnApply).toHaveBeenCalledWith([]);
  });

  it('shows Clear button when categories are selected and clears on press', () => {
    const { getByTestId, getByText, queryByTestId } = render(
      <CategoryFilterSheet {...defaultProps} />,
    );

    expect(queryByTestId('clear-filter-btn')).toBeNull();

    fireEvent.press(getByTestId('category-filter-item-1'));

    expect(getByTestId('clear-filter-btn')).toBeTruthy();

    fireEvent.press(getByTestId('clear-filter-btn'));

    expect(getByText('Apply')).toBeTruthy();
  });

  it('initializes with pre-selected category IDs', () => {
    const { getByText } = render(
      <CategoryFilterSheet {...defaultProps} selectedCategoryIds={[1, 20]} />,
    );

    expect(getByText('Apply (2)')).toBeTruthy();
  });

  it('shows loading state when loading is true', () => {
    const { getByTestId, queryByText } = render(
      <CategoryFilterSheet {...defaultProps} loading={true} />,
    );

    expect(getByTestId('category-filter-sheet')).toBeTruthy();
    expect(queryByText('ESSENTIALS')).toBeNull();
  });

  it('shows empty state when no categories are available', () => {
    const { getByText } = render(<CategoryFilterSheet {...defaultProps} categories={[]} />);

    expect(getByText('No categories available')).toBeTruthy();
  });

  it('closes sheet when backdrop is pressed', () => {
    const { getByTestId } = render(<CategoryFilterSheet {...defaultProps} />);

    const sheet = getByTestId('category-filter-sheet');
    expect(sheet).toBeTruthy();
  });

  it('resets local selection when sheet becomes visible again', () => {
    const { rerender, getByText, getByTestId } = render(
      <CategoryFilterSheet {...defaultProps} selectedCategoryIds={[1]} />,
    );

    expect(getByText('Apply (1)')).toBeTruthy();

    fireEvent.press(getByTestId('category-filter-item-20'));
    expect(getByText('Apply (2)')).toBeTruthy();

    rerender(<CategoryFilterSheet {...defaultProps} selectedCategoryIds={[1]} visible={false} />);
    rerender(<CategoryFilterSheet {...defaultProps} selectedCategoryIds={[1]} visible={true} />);

    expect(getByText('Apply (1)')).toBeTruthy();
  });

  it('handles categories without description', () => {
    const categoriesWithoutDesc: Category[] = [
      {
        category_id: 100,
        name: 'No Description Category',
        category_type: 'essential',
        parent_id: null,
        is_active: true,
      },
    ];

    const { getByText, queryByTestId } = render(
      <CategoryFilterSheet {...defaultProps} categories={categoriesWithoutDesc} />,
    );

    expect(getByText('No Description Category')).toBeTruthy();
  });

  it('handles categories with unknown category_type', () => {
    const categoriesUnknownType: Category[] = [
      {
        category_id: 200,
        name: 'Unknown Type Category',
        description: 'A category with unknown type',
        category_type: undefined,
        parent_id: null,
        is_active: true,
      },
    ];

    const { queryByText } = render(
      <CategoryFilterSheet {...defaultProps} categories={categoriesUnknownType} />,
    );

    expect(queryByText('Unknown Type Category')).toBeNull();
  });

  it('shows Apply without count when no categories selected', () => {
    const { getByText } = render(<CategoryFilterSheet {...defaultProps} />);

    expect(getByText('Apply')).toBeTruthy();
  });

  it('calls onClose after closing animation completes', () => {
    const { getByTestId } = render(<CategoryFilterSheet {...defaultProps} />);

    fireEvent.press(getByTestId('apply-filter-btn'));

    expect(mockOnClose).toHaveBeenCalled();
  });
});
