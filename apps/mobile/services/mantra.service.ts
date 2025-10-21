import { apiClient } from './api.config';

// ===== CONFIGURATION =====
// Set this to true to use mock data, false to use real API
const USE_MOCK_DATA = true;

// ===== TYPES =====
export interface Mantra {
  mantra_id: number;
  title: string;
  key_takeaway: string;
  background_author?: string;
  background_description?: string;
  jamie_take?: string;
  when_where?: string;
  negative_thoughts?: string;
  cbt_principles?: string;
  references?: string;
  created_at: string;
  is_active: boolean;
  isLiked?: boolean;
  isSaved?: boolean;
}

export interface MantraResponse {
  status: string;
  message?: string;
  data: Mantra[];
}

export interface LikeResponse {
  status: string;
  message: string;
  data: {
    like_id: number;
    user_id: number;
    mantra_id: number;
    created_at: string;
  };
}

export interface SaveToCollectionRequest {
  mantra_id: number;
  collection_id?: number;
}

// ===== MOCK DATA =====
const MOCK_MANTRAS: Mantra[] = [
  {
    mantra_id: 1,
    title: 'Pressure Is a Privilege',
    key_takeaway:
      'When you\'re spiralling or feeling tense, say it to yourself "Pressure is a privilege" and then smile to remind yourself to enjoy the fact that you got the opportunity.',
    background_author: 'Billie Jean King',
    background_description: 'Tennis legend who used this mantra during high-stakes matches',
    created_at: new Date().toISOString(),
    is_active: true,
    isLiked: false,
    isSaved: false,
  },
  {
    mantra_id: 2,
    title: 'The Only Way Out Is Through',
    key_takeaway:
      'When facing difficult situations, remind yourself that avoiding the challenge only prolongs the pain. Embrace the difficulty and move forward through it.',
    background_author: 'Robert Frost',
    background_description: 'From the poem "A Servant to Servants"',
    created_at: new Date().toISOString(),
    is_active: true,
    isLiked: false,
    isSaved: false,
  },
  {
    mantra_id: 3,
    title: 'What We Think, We Become',
    key_takeaway:
      'Your thoughts shape your reality. When negative thoughts arise, acknowledge them and consciously redirect to positive, empowering thoughts.',
    background_author: 'Buddha',
    background_description: 'Ancient wisdom about the power of mindset',
    created_at: new Date().toISOString(),
    is_active: true,
    isLiked: false,
    isSaved: false,
  },
  {
    mantra_id: 4,
    title: 'Embrace the Journey',
    key_takeaway:
      'Focus on the process rather than the outcome. Each step forward is progress, even if the destination seems far away.',
    created_at: new Date().toISOString(),
    is_active: true,
    isLiked: false,
    isSaved: false,
  },
  {
    mantra_id: 5,
    title: 'Be Here Now',
    key_takeaway:
      'When anxiety about the future or regret about the past overwhelms you, bring your attention to the present moment. What can you see, hear, and feel right now?',
    background_author: 'Ram Dass',
    background_description: 'Title of his influential 1971 book on mindfulness',
    created_at: new Date().toISOString(),
    is_active: true,
    isLiked: false,
    isSaved: false,
  },
];

// Track mock state for likes and saves
const mockUserState = {
  likedMantras: new Set<number>(),
  savedMantras: new Set<number>(),
};

// ===== MOCK SERVICE =====
const mockMantraService = {
  async getFeedMantras(_token: string): Promise<MantraResponse> {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    return {
      status: 'success',
      data: MOCK_MANTRAS.map((mantra) => ({
        ...mantra,
        isLiked: mockUserState.likedMantras.has(mantra.mantra_id),
        isSaved: mockUserState.savedMantras.has(mantra.mantra_id),
      })),
    };
  },

  async getLikedMantras(_token: string): Promise<MantraResponse> {
    await new Promise((resolve) => setTimeout(resolve, 500));

    const likedMantras = MOCK_MANTRAS.filter((m) => mockUserState.likedMantras.has(m.mantra_id));

    return {
      status: 'success',
      data: likedMantras,
    };
  },

  async getSavedMantras(_token: string): Promise<MantraResponse> {
    await new Promise((resolve) => setTimeout(resolve, 500));

    const savedMantras = MOCK_MANTRAS.filter((m) => mockUserState.savedMantras.has(m.mantra_id));

    return {
      status: 'success',
      data: savedMantras,
    };
  },

  async likeMantra(mantraId: number, _token: string): Promise<LikeResponse> {
    await new Promise((resolve) => setTimeout(resolve, 300));

    mockUserState.likedMantras.add(mantraId);

    return {
      status: 'success',
      message: 'Mantra liked successfully',
      data: {
        like_id: Date.now(),
        user_id: 1,
        mantra_id: mantraId,
        created_at: new Date().toISOString(),
      },
    };
  },

  async unlikeMantra(
    mantraId: number,
    _token: string,
  ): Promise<{ status: string; message: string }> {
    await new Promise((resolve) => setTimeout(resolve, 300));

    mockUserState.likedMantras.delete(mantraId);

    return {
      status: 'success',
      message: 'Mantra unliked successfully',
    };
  },

  async saveMantra(
    data: SaveToCollectionRequest,
    _token: string,
  ): Promise<{ status: string; message: string }> {
    await new Promise((resolve) => setTimeout(resolve, 300));

    mockUserState.savedMantras.add(data.mantra_id);

    return {
      status: 'success',
      message: 'Mantra saved successfully',
    };
  },

  async unsaveMantra(
    mantraId: number,
    _token: string,
  ): Promise<{ status: string; message: string }> {
    await new Promise((resolve) => setTimeout(resolve, 300));

    mockUserState.savedMantras.delete(mantraId);

    return {
      status: 'success',
      message: 'Mantra removed from collection',
    };
  },

  async getMantraById(mantraId: number, _token: string): Promise<{ status: string; data: Mantra }> {
    await new Promise((resolve) => setTimeout(resolve, 300));

    const mantra = MOCK_MANTRAS.find((m) => m.mantra_id === mantraId);

    if (!mantra) {
      throw new Error('Mantra not found');
    }

    return {
      status: 'success',
      data: {
        ...mantra,
        isLiked: mockUserState.likedMantras.has(mantraId),
        isSaved: mockUserState.savedMantras.has(mantraId),
      },
    };
  },
};

// ===== REAL API SERVICE =====
const realMantraService = {
  async getFeedMantras(token: string): Promise<MantraResponse> {
    const response = await apiClient.get<MantraResponse>('/mantras/feed', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  },

  async getLikedMantras(token: string): Promise<MantraResponse> {
    const response = await apiClient.get<MantraResponse>('/mantras/liked', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  },

  async getSavedMantras(token: string): Promise<MantraResponse> {
    const response = await apiClient.get<MantraResponse>('/mantras/saved', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  },

  async likeMantra(mantraId: number, token: string): Promise<LikeResponse> {
    const response = await apiClient.post<LikeResponse>(
      '/mantras/like',
      { mantra_id: mantraId },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    return response.data;
  },

  async unlikeMantra(
    mantraId: number,
    token: string,
  ): Promise<{ status: string; message: string }> {
    const response = await apiClient.delete(`/mantras/like/${mantraId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  },

  async saveMantra(
    data: SaveToCollectionRequest,
    token: string,
  ): Promise<{ status: string; message: string }> {
    const response = await apiClient.post('/mantras/save', data, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  },

  async unsaveMantra(
    mantraId: number,
    token: string,
  ): Promise<{ status: string; message: string }> {
    const response = await apiClient.delete(`/mantras/save/${mantraId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  },

  async getMantraById(mantraId: number, token: string): Promise<{ status: string; data: Mantra }> {
    const response = await apiClient.get(`/mantras/${mantraId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  },
};

// ===== EXPORTED SERVICE =====
// This automatically switches between mock and real based on USE_MOCK_DATA flag
export const mantraService = USE_MOCK_DATA ? mockMantraService : realMantraService;
