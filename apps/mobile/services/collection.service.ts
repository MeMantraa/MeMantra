import { apiClient } from './api.config';
import { Mantra } from './mantra.service';

export type Collection = {
  collection_id: number;
  name: string;
  description?: string | null;
  user_id: number;
  created_at: string;
};

export type CollectionWithMantras = {
  collection: Collection;
  mantras: Mantra[];
};

export interface CollectionsResponse {
  status: string;
  data: {
    collections: Collection[];
  };
}

export interface CollectionResponse {
  status: string;
  message?: string;
  data: {
    collection: Collection;
  };
}

export interface CollectionWithMantrasResponse {
  status: string;
  data: CollectionWithMantras;
}

export interface MessageResponse {
  status: string;
  message: string;
  alreadyExists?: boolean;
}

export const collectionService = {
  /**
   * Get all collections for the authenticated user
   */
  async getUserCollections(token: string): Promise<CollectionsResponse> {
    const response = await apiClient.get<CollectionsResponse>('/collections', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  },

  /**
   * Get a specific collection with its mantras
   */
  async getCollectionById(
    collectionId: number,
    token: string,
  ): Promise<CollectionWithMantrasResponse> {
    const response = await apiClient.get<CollectionWithMantrasResponse>(
      `/collections/${collectionId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    return response.data;
  },

  /**
   * Create a new collection
   */
  async createCollection(
    name: string,
    description: string | undefined,
    token: string,
  ): Promise<CollectionResponse> {
    const response = await apiClient.post<CollectionResponse>(
      '/collections',
      { name, description },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    return response.data;
  },

  /**
   * Update an existing collection
   */
  async updateCollection(
    collectionId: number,
    updates: { name?: string; description?: string },
    token: string,
  ): Promise<CollectionResponse> {
    const response = await apiClient.put<CollectionResponse>(
      `/collections/${collectionId}`,
      updates,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    return response.data;
  },

  /**
   * Delete a collection
   */
  async deleteCollection(collectionId: number, token: string): Promise<MessageResponse> {
    const response = await apiClient.delete<MessageResponse>(`/collections/${collectionId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  },

  /**
   * Add a mantra to a collection
   */
  async addMantraToCollection(
    collectionId: number,
    mantraId: number,
    token: string,
  ): Promise<MessageResponse> {
    const response = await apiClient.post<MessageResponse>(
      `/collections/${collectionId}/mantras/${mantraId}`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    return response.data;
  },

  /**
   * Remove a mantra from a collection
   */
  async removeMantraFromCollection(
    collectionId: number,
    mantraId: number,
    token: string,
  ): Promise<MessageResponse> {
    const response = await apiClient.delete<MessageResponse>(
      `/collections/${collectionId}/mantras/${mantraId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    return response.data;
  },
};
