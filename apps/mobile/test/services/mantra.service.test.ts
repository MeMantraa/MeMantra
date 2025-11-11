import { jest } from '@jest/globals';

// ---- Mock Setup ----
const INITIAL_MANTRAS = [
  {
    mantra_id: 1,
    title: 'Pressure Is a Privilege',
    key_takeaway:
      'When you\'re spiralling or feeling tense, say it to yourself "Pressure is a privilege" and then smile to remind yourself to enjoy the fact that you got the opportunity.',
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
    created_at: new Date().toISOString(),
    is_active: true,
    isLiked: false,
    isSaved: false,
  },
];

interface Mantra {
  mantra_id: number;
  title: string;
  key_takeaway: string;
  created_at: string;
  is_active: boolean;
  isLiked?: boolean;
  isSaved?: boolean;
}

let mockState: {
  mantras: Mantra[];
  likedMantras: Set<number>;
  savedMantras: Set<number>;
};

function resetState() {
  mockState = {
    mantras: INITIAL_MANTRAS.map((m) => ({ ...m })),
    likedMantras: new Set<number>(),
    savedMantras: new Set<number>(),
  };
}

jest.mock('../../services/api.config', () => ({
  apiClient: {
    get: jest.fn((_url: string) => {
      return Promise.resolve({
        data: {
          status: 'success',
          data: mockState.mantras.map((m: Mantra) => ({
            ...m,
            isLiked: mockState.likedMantras.has(m.mantra_id),
            isSaved: mockState.savedMantras.has(m.mantra_id),
          })),
        },
      });
    }),

    post: jest.fn((url: string, body: any) => {
      if (url === '/mantras/like') {
        mockState.likedMantras.add(body.mantra_id);
        return Promise.resolve({ data: { status: 'success', message: 'Liked successfully' } });
      }
      if (url === '/mantras/save') {
        mockState.savedMantras.add(body.mantra_id);
        return Promise.resolve({ data: { status: 'success', message: 'Saved successfully' } });
      }
      if (url === '/mantras') {
        const nextId = Math.max(...mockState.mantras.map((m) => m.mantra_id)) + 1;
        const newMantra = {
          ...body,
          mantra_id: nextId,
          created_at: new Date().toISOString(),
          is_active: body.is_active ?? true,
          isLiked: false,
          isSaved: false,
        };
        mockState.mantras = [newMantra, ...mockState.mantras];
        return Promise.resolve({
          data: {
            status: 'success',
            data: { mantra: newMantra },
          },
        });
      }
      return Promise.resolve({ data: {} });
    }),

    delete: jest.fn((url: string) => {
      if (url.startsWith('/mantras/like')) {
        const id = Number(url.split('/').pop());
        mockState.likedMantras.delete(id);
        return Promise.resolve({ data: { status: 'success', message: 'Unliked successfully' } });
      }
      if (url.startsWith('/mantras/save')) {
        const id = Number(url.split('/').pop());
        mockState.savedMantras.delete(id);
        return Promise.resolve({ data: { status: 'success', message: 'Removed from saved' } });
      }
      if (/^\/mantras\/\d+$/.test(url)) {
        const id = Number(url.split('/').pop());
        mockState.mantras = mockState.mantras.filter((m) => m.mantra_id !== id);
        mockState.likedMantras.delete(id);
        mockState.savedMantras.delete(id);
        return Promise.resolve({
          data: { status: 'success', message: 'Mantra deleted successfully' },
        });
      }
      return Promise.resolve({ data: {} });
    }),
    put: jest.fn(() => Promise.resolve({ data: {} })),
  },
}));

import { mantraService } from '../../services/mantra.service';

describe('mantraService (mock implementation)', () => {
  beforeEach(() => {
    resetState();
    jest.resetModules();
  });

  it('returns mock mantra data with success status', async () => {
    const response = await mantraService.getFeedMantras('token');
    expect(response.status).toBe('success');
    expect(response.data.length).toBeGreaterThan(0);
  });

  it('toggles liked state through like/unlike helpers', async () => {
    await mantraService.likeMantra(1, 'token');
    let response = await mantraService.getFeedMantras('token');
    const likedMantra = response.data.find((m: Mantra) => m.mantra_id === 1);
    expect(likedMantra?.isLiked).toBe(true);

    await mantraService.unlikeMantra(1, 'token');
    response = await mantraService.getFeedMantras('token');
    const unlikedMantra = response.data.find((m: Mantra) => m.mantra_id === 1);
    expect(unlikedMantra?.isLiked).toBe(false);
  });

  it('toggles saved state through save/unsave helpers', async () => {
    await mantraService.saveMantra(2, 'token');
    let response = await mantraService.getFeedMantras('token');
    const savedMantra = response.data.find((m: Mantra) => m.mantra_id === 2);
    expect(savedMantra?.isSaved).toBe(true);

    await mantraService.unsaveMantra(2, 'token');
    response = await mantraService.getFeedMantras('token');
    const unsavedMantra = response.data.find((m: Mantra) => m.mantra_id === 2);
    expect(unsavedMantra?.isSaved).toBe(false);
  });

  it('creates a new mantra via the admin helper', async () => {
    const createResponse = await mantraService.createMantra(
      {
        title: 'New Admin Mantra',
        key_takeaway: 'A fresh description',
      },
      'token',
    );

    expect(createResponse.status).toBe('success');
    expect(createResponse.data.mantra.title).toBe('New Admin Mantra');

    const response = await mantraService.getFeedMantras('token');
    const created = response.data.find((m: Mantra) => m.title === 'New Admin Mantra');
    expect(created).toBeTruthy();
    expect(created?.key_takeaway).toBe('A fresh description');
  });

  it('deletes an existing mantra via the admin helper', async () => {
    const initialResponse = await mantraService.getFeedMantras('token');
    const targetId = initialResponse.data[0].mantra_id;

    const deleteResponse = await mantraService.deleteMantra(targetId, 'token');
    expect(deleteResponse.status).toBe('success');

    const updatedResponse = await mantraService.getFeedMantras('token');
    expect(updatedResponse.data.find((m: Mantra) => m.mantra_id === targetId)).toBeUndefined();
  });
});
