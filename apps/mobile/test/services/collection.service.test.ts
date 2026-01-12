import { collectionService } from '../../services/collection.service';
import { apiClient } from '../../services/api.config';

jest.mock('../../services/api.config', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

describe('collectionService', () => {
  const mockToken = 'test-token-123';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserCollections', () => {
    it('should fetch all collections for the user', async () => {
      const mockResponse = {
        status: 'success',
        data: {
          collections: [
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
          ],
        },
      };

      (apiClient.get as jest.Mock).mockResolvedValue({ data: mockResponse });

      const result = await collectionService.getUserCollections(mockToken);

      expect(apiClient.get).toHaveBeenCalledWith('/collections', {
        headers: { Authorization: `Bearer ${mockToken}` },
      });
      expect(result).toEqual(mockResponse);
      expect(result.status).toBe('success');
      expect(result.data.collections).toHaveLength(2);
    });

    it('should handle API errors', async () => {
      (apiClient.get as jest.Mock).mockRejectedValue(new Error('Network error'));

      await expect(collectionService.getUserCollections(mockToken)).rejects.toThrow(
        'Network error',
      );
    });
  });

  describe('getCollectionById', () => {
    it('should fetch a specific collection with mantras', async () => {
      const mockResponse = {
        status: 'success',
        data: {
          collection: {
            collection_id: 1,
            name: 'Saved Mantras',
            description: 'Your saved mantras',
            user_id: 1,
            created_at: '2024-01-01',
          },
          mantras: [
            {
              mantra_id: 1,
              title: 'Test Mantra',
              key_takeaway: 'Test takeaway',
              created_at: '2024-01-01',
              is_active: true,
            },
          ],
        },
      };

      (apiClient.get as jest.Mock).mockResolvedValue({ data: mockResponse });

      const result = await collectionService.getCollectionById(1, mockToken);

      expect(apiClient.get).toHaveBeenCalledWith('/collections/1', {
        headers: { Authorization: `Bearer ${mockToken}` },
      });
      expect(result).toEqual(mockResponse);
      expect(result.data.mantras).toHaveLength(1);
    });

    it('should handle API errors', async () => {
      (apiClient.get as jest.Mock).mockRejectedValue(new Error('Not found'));

      await expect(collectionService.getCollectionById(999, mockToken)).rejects.toThrow(
        'Not found',
      );
    });
  });

  describe('createCollection', () => {
    it('should create a new collection with name and description', async () => {
      const mockResponse = {
        status: 'success',
        data: {
          collection: {
            collection_id: 3,
            name: 'New Collection',
            description: 'A new collection',
            user_id: 1,
            created_at: '2024-01-03',
          },
        },
      };

      (apiClient.post as jest.Mock).mockResolvedValue({ data: mockResponse });

      const result = await collectionService.createCollection(
        'New Collection',
        'A new collection',
        mockToken,
      );

      expect(apiClient.post).toHaveBeenCalledWith(
        '/collections',
        { name: 'New Collection', description: 'A new collection' },
        {
          headers: { Authorization: `Bearer ${mockToken}` },
        },
      );
      expect(result).toEqual(mockResponse);
    });

    it('should create a collection without description', async () => {
      const mockResponse = {
        status: 'success',
        data: {
          collection: {
            collection_id: 4,
            name: 'No Description',
            description: null,
            user_id: 1,
            created_at: '2024-01-04',
          },
        },
      };

      (apiClient.post as jest.Mock).mockResolvedValue({ data: mockResponse });

      const result = await collectionService.createCollection(
        'No Description',
        undefined,
        mockToken,
      );

      expect(apiClient.post).toHaveBeenCalledWith(
        '/collections',
        { name: 'No Description', description: undefined },
        {
          headers: { Authorization: `Bearer ${mockToken}` },
        },
      );
      expect(result).toEqual(mockResponse);
    });

    it('should handle API errors', async () => {
      (apiClient.post as jest.Mock).mockRejectedValue(new Error('Creation failed'));

      await expect(collectionService.createCollection('Test', 'Desc', mockToken)).rejects.toThrow(
        'Creation failed',
      );
    });
  });

  describe('updateCollection', () => {
    it('should update collection name', async () => {
      const mockResponse = {
        status: 'success',
        data: {
          collection: {
            collection_id: 1,
            name: 'Updated Name',
            description: 'Original description',
            user_id: 1,
            created_at: '2024-01-01',
          },
        },
      };

      (apiClient.put as jest.Mock).mockResolvedValue({ data: mockResponse });

      const result = await collectionService.updateCollection(
        1,
        { name: 'Updated Name' },
        mockToken,
      );

      expect(apiClient.put).toHaveBeenCalledWith(
        '/collections/1',
        { name: 'Updated Name' },
        {
          headers: { Authorization: `Bearer ${mockToken}` },
        },
      );
      expect(result).toEqual(mockResponse);
    });

    it('should update collection description', async () => {
      const mockResponse = {
        status: 'success',
        data: {
          collection: {
            collection_id: 1,
            name: 'Original Name',
            description: 'Updated description',
            user_id: 1,
            created_at: '2024-01-01',
          },
        },
      };

      (apiClient.put as jest.Mock).mockResolvedValue({ data: mockResponse });

      const result = await collectionService.updateCollection(
        1,
        { description: 'Updated description' },
        mockToken,
      );

      expect(apiClient.put).toHaveBeenCalledWith(
        '/collections/1',
        { description: 'Updated description' },
        {
          headers: { Authorization: `Bearer ${mockToken}` },
        },
      );
      expect(result).toEqual(mockResponse);
    });

    it('should update both name and description', async () => {
      const mockResponse = {
        status: 'success',
        data: {
          collection: {
            collection_id: 1,
            name: 'Updated Name',
            description: 'Updated description',
            user_id: 1,
            created_at: '2024-01-01',
          },
        },
      };

      (apiClient.put as jest.Mock).mockResolvedValue({ data: mockResponse });

      const result = await collectionService.updateCollection(
        1,
        { name: 'Updated Name', description: 'Updated description' },
        mockToken,
      );

      expect(apiClient.put).toHaveBeenCalledWith(
        '/collections/1',
        { name: 'Updated Name', description: 'Updated description' },
        {
          headers: { Authorization: `Bearer ${mockToken}` },
        },
      );
      expect(result).toEqual(mockResponse);
    });

    it('should handle API errors', async () => {
      (apiClient.put as jest.Mock).mockRejectedValue(new Error('Update failed'));

      await expect(
        collectionService.updateCollection(1, { name: 'Test' }, mockToken),
      ).rejects.toThrow('Update failed');
    });
  });

  describe('deleteCollection', () => {
    it('should delete a collection', async () => {
      const mockResponse = {
        status: 'success',
        message: 'Collection deleted successfully',
      };

      (apiClient.delete as jest.Mock).mockResolvedValue({ data: mockResponse });

      const result = await collectionService.deleteCollection(1, mockToken);

      expect(apiClient.delete).toHaveBeenCalledWith('/collections/1', {
        headers: { Authorization: `Bearer ${mockToken}` },
      });
      expect(result).toEqual(mockResponse);
      expect(result.message).toBe('Collection deleted successfully');
    });

    it('should handle API errors', async () => {
      (apiClient.delete as jest.Mock).mockRejectedValue(new Error('Delete failed'));

      await expect(collectionService.deleteCollection(1, mockToken)).rejects.toThrow(
        'Delete failed',
      );
    });
  });

  describe('addMantraToCollection', () => {
    it('should add a mantra to a collection', async () => {
      const mockResponse = {
        status: 'success',
        message: 'Mantra added to collection',
      };

      (apiClient.post as jest.Mock).mockResolvedValue({ data: mockResponse });

      const result = await collectionService.addMantraToCollection(1, 5, mockToken);

      expect(apiClient.post).toHaveBeenCalledWith(
        '/collections/1/mantras/5',
        {},
        {
          headers: { Authorization: `Bearer ${mockToken}` },
        },
      );
      expect(result).toEqual(mockResponse);
    });

    it('should handle duplicate mantra addition', async () => {
      const mockResponse = {
        status: 'error',
        message: 'Mantra already in collection',
        alreadyExists: true,
      };

      (apiClient.post as jest.Mock).mockResolvedValue({ data: mockResponse });

      const result = await collectionService.addMantraToCollection(1, 5, mockToken);

      expect(result.alreadyExists).toBe(true);
    });

    it('should handle API errors', async () => {
      (apiClient.post as jest.Mock).mockRejectedValue(new Error('Add failed'));

      await expect(collectionService.addMantraToCollection(1, 5, mockToken)).rejects.toThrow(
        'Add failed',
      );
    });
  });

  describe('removeMantraFromCollection', () => {
    it('should remove a mantra from a collection', async () => {
      const mockResponse = {
        status: 'success',
        message: 'Mantra removed from collection',
      };

      (apiClient.delete as jest.Mock).mockResolvedValue({ data: mockResponse });

      const result = await collectionService.removeMantraFromCollection(1, 5, mockToken);

      expect(apiClient.delete).toHaveBeenCalledWith('/collections/1/mantras/5', {
        headers: { Authorization: `Bearer ${mockToken}` },
      });
      expect(result).toEqual(mockResponse);
    });

    it('should handle API errors', async () => {
      (apiClient.delete as jest.Mock).mockRejectedValue(new Error('Remove failed'));

      await expect(collectionService.removeMantraFromCollection(1, 5, mockToken)).rejects.toThrow(
        'Remove failed',
      );
    });
  });
});
