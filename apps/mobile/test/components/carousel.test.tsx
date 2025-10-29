import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { View, FlatList } from 'react-native';
import MantraCarousel from '../../components/carousel';
import type { Mantra } from '../../services/mantra.service';

jest.mock('../../components/UI/saveButton', () => {
  const ReactActual = jest.requireActual('react');
  const RN = jest.requireActual('react-native');
  return {
    __esModule: true,
    default: (props: any) =>
      ReactActual.createElement(
        RN.TouchableOpacity,
        { testID: 'save-button', onPress: props.onPress, accessible: true },
        ReactActual.createElement(RN.Text, null, 'Save'),
      ),
  };
});

jest.mock('../../components/UI/likeButton', () => {
  const ReactActual = jest.requireActual('react');
  const RN = jest.requireActual('react-native');
  return {
    __esModule: true,
    default: (props: any) =>
      ReactActual.createElement(
        RN.TouchableOpacity,
        { testID: 'like-button', onPress: props.onPress, accessible: true },
        ReactActual.createElement(RN.Text, null, 'Like'),
      ),
  };
});

describe('MantraCarousel', () => {
  const mockItem: Mantra = {
    mantra_id: 1,
    title: 'Be present',
    key_takeaway: 'Focus on the moment',
    background_author: 'Author A',
    background_description: 'Some background info',
    jamie_take: 'Jamie thinks it’s great',
    when_where: 'Morning meditation',
    negative_thoughts: 'I am not enough',
    cbt_principles: 'Mindfulness',
    references: 'Reference text',
    isLiked: true,
    isSaved: false,
    created_at: new Date().toISOString(),
    is_active: true,
  };

  it('renders mantra title and all valid pages', () => {
    const { getByText } = render(<MantraCarousel item={mockItem} />);

    expect(getByText('Be present')).toBeTruthy();
    expect(getByText('Key Takeaway')).toBeTruthy();
    expect(getByText('Background')).toBeTruthy();
    expect(getByText("Jamie's Take")).toBeTruthy();
    expect(getByText('When & Where?')).toBeTruthy();
    expect(getByText('Negative Thoughts It Replaces')).toBeTruthy();
    expect(getByText('CBT Principles')).toBeTruthy();
    expect(getByText('References')).toBeTruthy();
  });

  it('renders correct number of carousel dots', () => {
    const { UNSAFE_getAllByType } = render(<MantraCarousel item={mockItem} />);
    const dots = UNSAFE_getAllByType(View).filter(
      (v) =>
        typeof v.props.className === 'string' &&
        v.props.className.includes('h-2') &&
        v.props.className.includes('mx-1'),
    );

    expect(dots.length).toBe(8);
  });

  it('calls onLike and onSave when respective buttons are pressed', () => {
    const onLike = jest.fn();
    const onSave = jest.fn();
    const { getByTestId } = render(
      <MantraCarousel item={mockItem} onLike={onLike} onSave={onSave} />,
    );

    fireEvent.press(getByTestId('like-button'));
    fireEvent.press(getByTestId('save-button'));

    expect(onLike).toHaveBeenCalledWith(mockItem.mantra_id);
    expect(onSave).toHaveBeenCalledWith(mockItem.mantra_id);
  });

  it('handles missing optional fields gracefully', () => {
    const minimalItem = {
      mantra_id: 2,
      title: 'Stay calm',
      key_takeaway: 'Breathe deeply',
      created_at: new Date().toISOString(),
      is_active: true,
      isLiked: false,
      isSaved: false,
    } as Mantra;

    const { getByText, queryByText } = render(<MantraCarousel item={minimalItem} />);

    expect(getByText('Stay calm')).toBeTruthy();
    expect(getByText('Key Takeaway')).toBeTruthy();
    expect(queryByText('Background')).toBeNull();
    expect(queryByText("Jamie's Take")).toBeNull();
  });

  it('updates currentIndex when viewable items change', () => {
    const { UNSAFE_getByType } = render(<MantraCarousel item={mockItem} />);
    const flatList = UNSAFE_getByType(FlatList);

    flatList.props.onViewableItemsChanged({ viewableItems: [{ index: 3 }] });
  });

  it('does not crash if viewableItems is empty', () => {
    const { UNSAFE_getByType } = render(<MantraCarousel item={mockItem} />);
    const flatList = UNSAFE_getByType(FlatList);

    expect(() => flatList.props.onViewableItemsChanged({ viewableItems: [] })).not.toThrow();
  });

  it('does not call onLike or onSave when callbacks are not provided', () => {
    const { getByTestId } = render(<MantraCarousel item={mockItem} />);
    // pressing mock buttons should be safe even if callbacks are undefined
    fireEvent.press(getByTestId('like-button'));
    fireEvent.press(getByTestId('save-button'));
  });

  it('uses fallback 0 index when viewableItems[0].index is undefined', () => {
    const { UNSAFE_getByType } = render(<MantraCarousel item={mockItem} />);
    const flatList = UNSAFE_getByType(FlatList);
    expect(() => flatList.props.onViewableItemsChanged({ viewableItems: [{}] })).not.toThrow();
  });
});
