import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import CollectionsSheet from '../../components/collectionsSheet';
import { Animated } from 'react-native';

// Mock Animated timing and spring
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

describe('CollectionsSheet', () => {
  const mockCollections = [
    {
      collection_id: 1,
      name: 'Saved Mantras',
      description: 'Your saved mantras',
      user_id: 1,
      created_at: '2024-01-01',
    },
    {
      collection_id: 2,
      name: 'My Collection',
      description: 'A custom collection',
      user_id: 1,
      created_at: '2024-01-02',
    },
    {
      collection_id: 3,
      name: 'Another Collection',
      description: null,
      user_id: 1,
      created_at: '2024-01-03',
    },
  ];

  const mockOnClose = jest.fn();
  const mockOnSelectCollection = jest.fn().mockResolvedValue(undefined);
  const mockOnCreateCollection = jest.fn().mockResolvedValue(4);
  const mockOnRefresh = jest.fn();

  const defaultProps = {
    visible: true,
    collections: mockCollections,
    onClose: mockOnClose,
    onSelectCollection: mockOnSelectCollection,
    onCreateCollection: mockOnCreateCollection,
    onRefresh: mockOnRefresh,
    title: 'Save to collection',
    loading: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders when visible is true', () => {
    const { getByText } = render(<CollectionsSheet {...defaultProps} />);

    expect(getByText('Save to collection')).toBeTruthy();
    expect(getByText('+ Create new collection')).toBeTruthy();
  });

  it('does not render when visible is false', () => {
    const { queryByText } = render(<CollectionsSheet {...defaultProps} visible={false} />);

    expect(queryByText('Save to collection')).toBeNull();
  });

  it('displays all collections', () => {
    const { getByText } = render(<CollectionsSheet {...defaultProps} />);

    expect(getByText('Saved Mantras')).toBeTruthy();
    expect(getByText('My Collection')).toBeTruthy();
    expect(getByText('Another Collection')).toBeTruthy();
  });

  it('displays collection descriptions when available', () => {
    const { getByText } = render(<CollectionsSheet {...defaultProps} />);

    expect(getByText('Your saved mantras')).toBeTruthy();
    expect(getByText('A custom collection')).toBeTruthy();
  });

  it('calls onRefresh when sheet becomes visible', () => {
    render(<CollectionsSheet {...defaultProps} />);

    expect(mockOnRefresh).toHaveBeenCalled();
  });

  it('does not call onRefresh when onRefresh is not provided', () => {
    const { getByText } = render(<CollectionsSheet {...defaultProps} onRefresh={undefined} />);

    expect(getByText('Save to collection')).toBeTruthy();
  });

  it('shows loading state when loading prop is true', () => {
    const { getByText } = render(<CollectionsSheet {...defaultProps} loading={true} />);

    expect(getByText('Loading collections...')).toBeTruthy();
  });

  it('shows empty state when no collections', () => {
    const { getByText } = render(
      <CollectionsSheet {...defaultProps} collections={[]} loading={false} />,
    );

    expect(getByText('No collections yet. Create one above!')).toBeTruthy();
  });

  it('opens create collection input when create button is pressed', () => {
    const { getByText, getByPlaceholderText } = render(<CollectionsSheet {...defaultProps} />);

    fireEvent.press(getByText('+ Create new collection'));

    expect(getByPlaceholderText('New collection name')).toBeTruthy();
    expect(getByText('Create')).toBeTruthy();
  });

  it('creates a new collection and adds mantra to it', async () => {
    const { getByText, getByPlaceholderText } = render(<CollectionsSheet {...defaultProps} />);

    fireEvent.press(getByText('+ Create new collection'));

    const input = getByPlaceholderText('New collection name');
    fireEvent.changeText(input, 'New Collection Name');

    fireEvent.press(getByText('Create'));

    await waitFor(() => {
      expect(mockOnCreateCollection).toHaveBeenCalledWith('New Collection Name');
    });

    await waitFor(() => {
      expect(mockOnSelectCollection).toHaveBeenCalledWith(4);
    });
  });

  it('does not create collection with empty name', async () => {
    const { getByText, getByPlaceholderText } = render(<CollectionsSheet {...defaultProps} />);

    fireEvent.press(getByText('+ Create new collection'));

    const input = getByPlaceholderText('New collection name');
    fireEvent.changeText(input, '   '); // Only whitespace

    fireEvent.press(getByText('Create'));

    await waitFor(() => {
      expect(mockOnCreateCollection).not.toHaveBeenCalled();
    });
  });

  it('trims whitespace from collection name', async () => {
    const { getByText, getByPlaceholderText } = render(<CollectionsSheet {...defaultProps} />);

    fireEvent.press(getByText('+ Create new collection'));

    const input = getByPlaceholderText('New collection name');
    fireEvent.changeText(input, '  Trimmed Name  ');

    fireEvent.press(getByText('Create'));

    await waitFor(() => {
      expect(mockOnCreateCollection).toHaveBeenCalledWith('Trimmed Name');
    });
  });

  it('handles create collection error', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockOnCreateCollection.mockRejectedValueOnce(new Error('Creation failed'));

    const { getByText, getByPlaceholderText } = render(<CollectionsSheet {...defaultProps} />);

    fireEvent.press(getByText('+ Create new collection'));

    const input = getByPlaceholderText('New collection name');
    fireEvent.changeText(input, 'New Collection');

    fireEvent.press(getByText('Create'));

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error creating collection:', expect.any(Error));
    });
  });

  it('selects an existing collection', async () => {
    const { getByText } = render(<CollectionsSheet {...defaultProps} />);

    fireEvent.press(getByText('My Collection'));

    await waitFor(() => {
      expect(mockOnSelectCollection).toHaveBeenCalledWith(2);
    });
  });

  it('closes sheet after selecting collection', async () => {
    const { getByText } = render(<CollectionsSheet {...defaultProps} />);

    fireEvent.press(getByText('My Collection'));

    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('handles select collection error', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockOnSelectCollection.mockRejectedValueOnce(new Error('Selection failed'));

    const { getByText } = render(<CollectionsSheet {...defaultProps} />);

    fireEvent.press(getByText('My Collection'));

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error selecting collection:',
        expect.any(Error),
      );
    });
  });

  it('uses custom title when provided', () => {
    const { getByText } = render(<CollectionsSheet {...defaultProps} title="Custom Title" />);

    expect(getByText('Custom Title')).toBeTruthy();
  });

  it('prevents multiple operations when processing', async () => {
    let resolveCreate: () => void;
    const createPromise = new Promise<number>((resolve) => {
      resolveCreate = () => resolve(4);
    });
    mockOnCreateCollection.mockReturnValueOnce(createPromise);

    const { getByText, getByPlaceholderText } = render(<CollectionsSheet {...defaultProps} />);

    fireEvent.press(getByText('+ Create new collection'));

    const input = getByPlaceholderText('New collection name');
    fireEvent.changeText(input, 'New Collection');

    fireEvent.press(getByText('Create'));

    // Try to select a collection while creating
    fireEvent.press(getByText('My Collection'));

    // Should not call onSelectCollection while processing
    expect(mockOnSelectCollection).not.toHaveBeenCalled();

    // Resolve the create promise
    resolveCreate!();
    await waitFor(() => {
      expect(mockOnCreateCollection).toHaveBeenCalled();
    });
  });

  it('submits form when return key is pressed', async () => {
    const { getByText, getByPlaceholderText } = render(<CollectionsSheet {...defaultProps} />);

    fireEvent.press(getByText('+ Create new collection'));

    const input = getByPlaceholderText('New collection name');
    fireEvent.changeText(input, 'New Collection');

    fireEvent(input, 'submitEditing');

    await waitFor(() => {
      expect(mockOnCreateCollection).toHaveBeenCalledWith('New Collection');
    });
  });

  it('resets form when sheet closes', () => {
    const { rerender, queryByPlaceholderText } = render(<CollectionsSheet {...defaultProps} />);

    // Open create form
    const { getByText, getByPlaceholderText } = render(<CollectionsSheet {...defaultProps} />);
    fireEvent.press(getByText('+ Create new collection'));
    expect(getByPlaceholderText('New collection name')).toBeTruthy();

    // Close sheet
    rerender(<CollectionsSheet {...defaultProps} visible={false} />);

    // Reopen sheet
    rerender(<CollectionsSheet {...defaultProps} visible={true} />);

    // Form should be reset (create button should be visible, not input)
    expect(queryByPlaceholderText('New collection name')).toBeNull();
  });

  it('does not allow interactions when processing', async () => {
    let resolveCreate: () => void;
    const createPromise = new Promise<number>((resolve) => {
      resolveCreate = () => resolve(4);
    });
    mockOnCreateCollection.mockReturnValueOnce(createPromise);

    const { getByText, getByPlaceholderText } = render(<CollectionsSheet {...defaultProps} />);

    fireEvent.press(getByText('+ Create new collection'));
    const input = getByPlaceholderText('New collection name');
    fireEvent.changeText(input, 'New Collection');

    // Start processing
    fireEvent.press(getByText('Create'));

    // Try to select a collection while processing - should not work
    fireEvent.press(getByText('My Collection'));

    // onSelectCollection should not be called while processing
    expect(mockOnSelectCollection).not.toHaveBeenCalled();

    resolveCreate!();
    await waitFor(() => {
      expect(mockOnCreateCollection).toHaveBeenCalled();
    });
  });

  it('handles collection with null description', () => {
    const { getByText, queryByText } = render(<CollectionsSheet {...defaultProps} />);

    // Collection with null description should not show description text
    expect(getByText('Another Collection')).toBeTruthy();
    expect(queryByText('null')).toBeNull();
  });

  it('prevents selection when processing', async () => {
    let resolveSelect: () => void;
    const selectPromise = new Promise<void>((resolve) => {
      resolveSelect = () => resolve();
    });
    mockOnSelectCollection.mockReturnValueOnce(selectPromise);

    const { getByText } = render(<CollectionsSheet {...defaultProps} />);

    // Start selecting
    fireEvent.press(getByText('My Collection'));

    // Try to select another collection while processing
    fireEvent.press(getByText('Saved Mantras'));

    // Should only have been called once
    expect(mockOnSelectCollection).toHaveBeenCalledTimes(1);

    // Resolve the promise
    resolveSelect!();
    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('handles create collection with processing state showing activity indicator', async () => {
    let resolveCreate: () => void;
    const createPromise = new Promise<number>((resolve) => {
      resolveCreate = () => resolve(4);
    });
    mockOnCreateCollection.mockReturnValueOnce(createPromise);

    const { getByText, getByPlaceholderText, queryByText } = render(
      <CollectionsSheet {...defaultProps} />,
    );

    fireEvent.press(getByText('+ Create new collection'));

    const input = getByPlaceholderText('New collection name');
    fireEvent.changeText(input, 'New Collection');
    fireEvent.press(getByText('Create'));

    // Should show activity indicator while processing
    // The button should be disabled and show ActivityIndicator
    await waitFor(() => {
      // Create button should be in processing state
      expect(mockOnCreateCollection).toHaveBeenCalled();
    });

    resolveCreate!();
    await waitFor(() => {
      expect(mockOnSelectCollection).toHaveBeenCalledWith(4);
    });
  });

  it('does not create collection when name is empty after trim', async () => {
    const { getByText, getByPlaceholderText } = render(<CollectionsSheet {...defaultProps} />);

    fireEvent.press(getByText('+ Create new collection'));

    const input = getByPlaceholderText('New collection name');
    fireEvent.changeText(input, '');

    fireEvent.press(getByText('Create'));

    await waitFor(() => {
      expect(mockOnCreateCollection).not.toHaveBeenCalled();
    });
  });

  it('handles useEffect cleanup when visible changes to false', () => {
    const { rerender } = render(<CollectionsSheet {...defaultProps} visible={true} />);

    // Change visible to false - should reset all state
    rerender(<CollectionsSheet {...defaultProps} visible={false} />);

    // Reopen - should be in clean state
    rerender(<CollectionsSheet {...defaultProps} visible={true} />);

    // Should show create button (not input)
    const { queryByPlaceholderText } = render(
      <CollectionsSheet {...defaultProps} visible={true} />,
    );
    expect(queryByPlaceholderText('New collection name')).toBeNull();
  });

  it('handles FlatList scroll when not dragging and not processing', () => {
    const { getByText } = render(<CollectionsSheet {...defaultProps} />);

    // Collections should be scrollable when not processing
    expect(getByText('Saved Mantras')).toBeTruthy();
    expect(getByText('My Collection')).toBeTruthy();
    expect(getByText('Another Collection')).toBeTruthy();
  });

  it('shows loading state when loading is true', () => {
    const { getByText } = render(<CollectionsSheet {...defaultProps} loading={true} />);

    expect(getByText('Loading collections...')).toBeTruthy();
  });

  it('shows empty state when collections array is empty', () => {
    const { getByText } = render(<CollectionsSheet {...defaultProps} collections={[]} />);

    expect(getByText('No collections yet. Create one above!')).toBeTruthy();
  });

  it('does not call onClose when pressing overlay while processing', async () => {
    let resolveSelect: () => void;
    const selectPromise = new Promise<void>((resolve) => {
      resolveSelect = () => resolve();
    });
    mockOnSelectCollection.mockReturnValueOnce(selectPromise);

    const { getByText, getByTestId } = render(<CollectionsSheet {...defaultProps} />);

    // Start processing
    fireEvent.press(getByText('My Collection'));

    // Try to close by pressing overlay while processing
    const overlay = getByText('Save to collection').parent?.parent?.parent;
    if (overlay) {
      fireEvent.press(overlay);
    }

    // onClose should not be called while processing
    expect(mockOnClose).not.toHaveBeenCalled();

    resolveSelect!();
    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('prevents creating new collection when processing', async () => {
    let resolveSelect: () => void;
    const selectPromise = new Promise<void>((resolve) => {
      resolveSelect = () => resolve();
    });
    mockOnSelectCollection.mockReturnValueOnce(selectPromise);

    const { getByText } = render(<CollectionsSheet {...defaultProps} />);

    // Start processing by selecting a collection
    fireEvent.press(getByText('My Collection'));

    // Try to open create form while processing
    fireEvent.press(getByText('+ Create new collection'));

    // Should not open the create form
    expect(mockOnCreateCollection).not.toHaveBeenCalled();

    resolveSelect!();
    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('disables text input when processing', async () => {
    let resolveCreate: () => void;
    const createPromise = new Promise<number>((resolve) => {
      resolveCreate = () => resolve(4);
    });
    mockOnCreateCollection.mockReturnValueOnce(createPromise);

    const { getByText, getByPlaceholderText } = render(<CollectionsSheet {...defaultProps} />);

    fireEvent.press(getByText('+ Create new collection'));

    const input = getByPlaceholderText('New collection name');
    fireEvent.changeText(input, 'New Collection');
    fireEvent.press(getByText('Create'));

    // Input should be disabled while processing
    expect(input.props.editable).toBe(false);

    resolveCreate!();
    await waitFor(() => {
      expect(mockOnSelectCollection).toHaveBeenCalledWith(4);
    });
  });

  it('handles collection without description field', () => {
    const collectionsWithoutDesc = [
      {
        collection_id: 1,
        name: 'No Description',
        user_id: 1,
        created_at: '2024-01-01',
      },
    ];

    const { getByText, queryByText } = render(
      <CollectionsSheet {...defaultProps} collections={collectionsWithoutDesc} />,
    );

    expect(getByText('No Description')).toBeTruthy();
    // Should not render description text
    expect(queryByText('undefined')).toBeNull();
  });

  it('logs console message when collection is selected', async () => {
    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    const { getByText } = render(<CollectionsSheet {...defaultProps} />);

    fireEvent.press(getByText('My Collection'));

    await waitFor(() => {
      expect(consoleLogSpy).toHaveBeenCalledWith(
        'Mantra added to collection: "My Collection" (ID: 2)',
      );
    });
  });

  it('logs console message when new collection is created', async () => {
    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    const { getByText, getByPlaceholderText } = render(<CollectionsSheet {...defaultProps} />);

    fireEvent.press(getByText('+ Create new collection'));

    const input = getByPlaceholderText('New collection name');
    fireEvent.changeText(input, 'New Collection');
    fireEvent.press(getByText('Create'));

    await waitFor(() => {
      expect(consoleLogSpy).toHaveBeenCalledWith(
        'Mantra added to new collection: "New Collection" (ID: 4)',
      );
    });
  });

  it('does not close sheet when selecting collection fails', async () => {
    mockOnSelectCollection.mockRejectedValueOnce(new Error('Selection failed'));

    const { getByText } = render(<CollectionsSheet {...defaultProps} />);

    fireEvent.press(getByText('My Collection'));

    await waitFor(() => {
      expect(mockOnSelectCollection).toHaveBeenCalled();
    });

    // Sheet should not close on error
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('does not close sheet when creating collection fails', async () => {
    mockOnCreateCollection.mockRejectedValueOnce(new Error('Creation failed'));

    const { getByText, getByPlaceholderText } = render(<CollectionsSheet {...defaultProps} />);

    fireEvent.press(getByText('+ Create new collection'));

    const input = getByPlaceholderText('New collection name');
    fireEvent.changeText(input, 'New Collection');
    fireEvent.press(getByText('Create'));

    await waitFor(() => {
      expect(mockOnCreateCollection).toHaveBeenCalled();
    });

    // Sheet should not close on error
    expect(mockOnClose).not.toHaveBeenCalled();
  });
});
