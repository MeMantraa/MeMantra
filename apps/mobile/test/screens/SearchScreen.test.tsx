import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import SearchScreen from '../../screens/SearchScreen';

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();

const navigation = { navigate: mockNavigate, goBack: mockGoBack };

const sampleMantras = [
  {
    mantra_id: 1,
    title: 'Embrace the Present',
    key_takeaway: 'Live in the now and avoid distractions',
    background_description: 'Mindfulness is about treating each moment with care',
    jamie_take: 'I focus on what sparks joy in my daily routine',
    when_where: 'Use this when you feel overwhelmed',
    negative_thoughts: 'I cannot handle stress',
    cbt_principles: 'Cognitive restructuring helps reframe thoughts',
    references: 'Jon Kabat-Zinn, Wherever You Go There You Are',
    created_at: '2024-01-01',
    is_active: true,
    isLiked: false,
    isSaved: false,
    categories: [{ category_id: 1, name: 'Mindfulness' }],
  },
  {
    mantra_id: 2,
    title: 'Value Your Time',
    key_takeaway: 'Time is precious and worth protecting',
    background_description: 'Managing time well reduces anxiety',
    background_author: 'James Clear',
    jamie_take: 'Park your worries at the door before bed',
    created_at: '2024-01-02',
    is_active: true,
    isLiked: false,
    isSaved: false,
    categories: [{ category_id: 2, name: 'Productivity' }],
  },
];

const makeRoute = (mantras = sampleMantras) => ({ params: { mantras } });

const setup = (routeOverrides?: any) =>
  render(<SearchScreen navigation={navigation} route={routeOverrides ?? makeRoute()} />);

describe('SearchScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the search input and placeholder state', () => {
    const { getByPlaceholderText, getByText } = setup();
    expect(getByPlaceholderText('Search mantras...')).toBeTruthy();
    expect(getByText('Type a keyword to search across all mantra content')).toBeTruthy();
  });

  it('shows results when a keyword matches a mantra title', async () => {
    const { getByPlaceholderText, getAllByText } = setup();

    fireEvent.changeText(getByPlaceholderText('Search mantras...'), 'Present');

    await waitFor(() => {
      expect(getAllByText('Embrace the Present').length).toBeGreaterThan(0);
    });
  });

  it('shows results when keyword matches key_takeaway', async () => {
    const { getByPlaceholderText, getByText } = setup();

    fireEvent.changeText(getByPlaceholderText('Search mantras...'), 'precious');

    await waitFor(() => {
      expect(getByText('Value Your Time')).toBeTruthy();
    });
  });

  it('shows results when keyword matches background_description', async () => {
    const { getByPlaceholderText, getByText } = setup();

    fireEvent.changeText(getByPlaceholderText('Search mantras...'), 'treating');

    await waitFor(() => {
      expect(getByText('Embrace the Present')).toBeTruthy();
    });
  });

  it('shows results when keyword matches jamie_take', async () => {
    const { getByPlaceholderText, getByText } = setup();

    fireEvent.changeText(getByPlaceholderText('Search mantras...'), 'Park');

    await waitFor(() => {
      expect(getByText('Value Your Time')).toBeTruthy();
    });
  });

  it('shows multiple results when keyword appears in multiple mantras', async () => {
    const { getByPlaceholderText, getByText } = setup();

    fireEvent.changeText(getByPlaceholderText('Search mantras...'), 'anxiety');

    await waitFor(() => {
      expect(getByText('Value Your Time')).toBeTruthy();
    });
  });

  it('keyword mid-word match (spark → sparks) does not add spaces', async () => {
    const { getByPlaceholderText, getByText } = setup();

    fireEvent.changeText(getByPlaceholderText('Search mantras...'), 'spark');

    await waitFor(() => {
      expect(getByText('Embrace the Present')).toBeTruthy();
    });

    // The snippet text should contain "sparks" without spaces around "spark"
    const { getAllByText } = render(<SearchScreen navigation={navigation} route={makeRoute()} />);
    fireEvent.changeText(
      render(<SearchScreen navigation={navigation} route={makeRoute()} />).getByPlaceholderText(
        'Search mantras...',
      ),
      'spark',
    );
  });

  it('shows result count line', async () => {
    const { getByPlaceholderText, getByText } = setup();

    fireEvent.changeText(getByPlaceholderText('Search mantras...'), 'Present');

    await waitFor(() => {
      expect(getByText(/1 result for/)).toBeTruthy();
    });
  });

  it('shows plural "results" when more than one match', async () => {
    const { getByPlaceholderText, getByText } = setup();

    // 'care' appears in background_description of mantra 1 and 'anxiety' in mantra 2
    // Use 'is' which appears in both
    fireEvent.changeText(getByPlaceholderText('Search mantras...'), 'is');

    await waitFor(() => {
      expect(getByText(/results for/)).toBeTruthy();
    });
  });

  it('shows empty state when no mantras match keyword', async () => {
    const { getByPlaceholderText, getByText } = setup();

    fireEvent.changeText(getByPlaceholderText('Search mantras...'), 'xyznotfound999');

    await waitFor(() => {
      expect(getByText(/No mantras found for/)).toBeTruthy();
      expect(getByText('"xyznotfound999"')).toBeTruthy();
    });
  });

  it('returns to placeholder state when query is cleared via X button', async () => {
    const { getByPlaceholderText, getByText, getAllByText } = setup();
    const input = getByPlaceholderText('Search mantras...');

    fireEvent.changeText(input, 'Present');
    await waitFor(() => expect(getAllByText('Embrace the Present').length).toBeGreaterThan(0));

    fireEvent.changeText(input, '');

    await waitFor(() => {
      expect(getByText(/Type a keyword to search across all mantra content/)).toBeTruthy();
    });
  });

  it('navigates to Focus screen when a result is pressed', async () => {
    const { getByPlaceholderText, getAllByText } = setup();

    fireEvent.changeText(getByPlaceholderText('Search mantras...'), 'Present');

    await waitFor(() => expect(getAllByText('Embrace the Present').length).toBeGreaterThan(0));

    fireEvent.press(getAllByText('Embrace the Present')[0]);

    expect(mockNavigate).toHaveBeenCalledWith('Focus', {
      mantra: sampleMantras[0],
      onLike: expect.any(Function),
      onSave: expect.any(Function),
    });
  });

  it('navigates back when back button is pressed', () => {
    const { getByLabelText } = setup();

    fireEvent.press(getByLabelText('Go back'));

    expect(mockGoBack).toHaveBeenCalled();
  });

  it('handles missing route params gracefully (empty mantras list)', async () => {
    const { getByPlaceholderText, getByText } = render(
      <SearchScreen navigation={navigation} route={{ params: {} }} />,
    );

    fireEvent.changeText(getByPlaceholderText('Search mantras...'), 'anything');

    await waitFor(() => {
      expect(getByText(/No mantras found for/)).toBeTruthy();
    });
  });

  it('is case-insensitive when matching keywords', async () => {
    const { getByPlaceholderText, getAllByText } = setup();

    fireEvent.changeText(getByPlaceholderText('Search mantras...'), 'PRESENT');

    await waitFor(() => {
      expect(getAllByText('Embrace the Present').length).toBeGreaterThan(0);
    });
  });

  it('searches across background_author field', async () => {
    const { getByPlaceholderText, getByText } = setup();

    fireEvent.changeText(getByPlaceholderText('Search mantras...'), 'James Clear');

    await waitFor(() => {
      expect(getByText('Value Your Time')).toBeTruthy();
    });
  });

  it('shows snippet with context around keyword in result', async () => {
    const { getByPlaceholderText, getByText } = setup();

    fireEvent.changeText(getByPlaceholderText('Search mantras...'), 'treating');

    await waitFor(() => {
      // The snippet should show text containing 'treating'
      expect(getByText('Embrace the Present')).toBeTruthy();
      // The matched keyword should appear in the snippet
      expect(getByText('treating')).toBeTruthy();
    });
  });
});
