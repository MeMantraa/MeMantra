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

// Mocks for apiClient as required by mantra.service.ts
jest.mock('../../services/api.config', () => ({
  apiClient: {
    get: jest.fn((url: string) => {
      // Handle single mantra fetch by ID
      const singleMantraMatch = url.match(/^\/mantras\/(\d+)$/);
      if (singleMantraMatch) {
        const mantraId = Number(singleMantraMatch[1]);
        const mantra = mockState.mantras.find((m: Mantra) => m.mantra_id === mantraId);
        if (mantra) {
          return Promise.resolve({
            data: {
              status: 'success',
              data: {
                ...mantra,
                isLiked: mockState.likedMantras.has(mantra.mantra_id),
                isSaved: mockState.savedMantras.has(mantra.mantra_id),
              },
            },
          });
        } else {
          return Promise.resolve({
            data: {
              status: 'error',
              message: 'Mantra not found',
              data: null,
            },
          });
        }
      }

      // Handle saved mantras
      if (url === '/mantras/saved') {
        const savedMantras = mockState.mantras
          .filter((m: Mantra) => mockState.savedMantras.has(m.mantra_id))
          .map((m: Mantra) => ({
            ...m,
            isLiked: mockState.likedMantras.has(m.mantra_id),
            isSaved: true,
          }));
        return Promise.resolve({
          data: {
            status: 'success',
            data: savedMantras,
          },
        });
      }

      // Handle feed mantras
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
      if (url.match(/^\/likes\/\d+$/)) {
        const mantraId = Number(url.split('/')[2]);
        mockState.likedMantras.add(mantraId);
        return Promise.resolve({ data: { status: 'success', message: 'Liked successfully' } });
      }
      if (url.match(/^\/mantras\/\d+\/save$/)) {
        const mantraId = Number(url.split('/')[2]);
        mockState.savedMantras.add(mantraId);
        return Promise.resolve({ data: { status: 'success', message: 'Saved successfully' } });
      }
      if (url === '/mantras') {
        const nextId = mockState.mantras.length
          ? Math.max(...mockState.mantras.map((m) => m.mantra_id)) + 1
          : 1;
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
      if (url.match(/^\/likes\/\d+$/)) {
        const id = Number(url.split('/')[2]);
        mockState.likedMantras.delete(id);
        return Promise.resolve({ data: { status: 'success', message: 'Unliked successfully' } });
      }
      if (url.match(/^\/mantras\/\d+\/save\/?$/)) {
        const parts = url.split('/');
        const mantraId = Number(parts[2]);
        mockState.savedMantras.delete(mantraId);
        return Promise.resolve({ data: { status: 'success', message: 'Removed from saved' } });
      }
      if (/^\/mantras\/\d+$/.test(url)) {
        const id = Number(url.split('/').pop());
        const beforeCount = mockState.mantras.length;
        mockState.mantras = mockState.mantras.filter((m) => m.mantra_id !== id);
        mockState.likedMantras.delete(id);
        mockState.savedMantras.delete(id);
        return Promise.resolve({
          data:
            beforeCount !== mockState.mantras.length
              ? { status: 'success', message: 'Mantra deleted successfully' }
              : { status: 'error', message: 'Mantra not found' },
        });
      }
      return Promise.resolve({ data: {} });
    }),
    put: jest.fn((url: string, body: any) => {
      const id = Number(url.split('/').pop());
      const index = mockState.mantras.findIndex((m) => m.mantra_id === id);
      if (index !== -1) {
        mockState.mantras[index] = {
          ...mockState.mantras[index],
          ...body,
        };
        return Promise.resolve({
          data: {
            status: 'success',
            data: { mantra: mockState.mantras[index] },
          },
        });
      } else {
        return Promise.resolve({
          data: {
            status: 'error',
            message: 'Mantra not found',
            data: { mantra: null },
          },
        });
      }
    }),
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
    expect(Array.isArray(response.data)).toBe(true);
    expect(response.data.length).toBeGreaterThan(0);
    expect(response.data.every((m) => typeof m.mantra_id === 'number')).toBeTruthy();
  });

  it('toggles liked state through like/unlike helpers, maintains like in feed', async () => {
    await mantraService.likeMantra(2, 'token');
    let response = await mantraService.getFeedMantras('token');
    expect(response.data.find((m) => m.mantra_id === 2)?.isLiked).toBe(true);

    await mantraService.unlikeMantra(2, 'token');
    response = await mantraService.getFeedMantras('token');
    expect(response.data.find((m) => m.mantra_id === 2)?.isLiked).toBe(false);
  });

  it('toggles saved state through save/unsave helpers, maintains save in feed', async () => {
    await mantraService.saveMantra(3, 'token');
    let response = await mantraService.getFeedMantras('token');
    expect(response.data.find((m) => m.mantra_id === 3)?.isSaved).toBe(true);

    await mantraService.unsaveMantra(3, 'token');
    response = await mantraService.getFeedMantras('token');
    expect(response.data.find((m) => m.mantra_id === 3)?.isSaved).toBe(false);
  });

  it('creates a new mantra via the admin helper and appears in feed', async () => {
    const createResp = await mantraService.createMantra(
      { title: 'Brand New', key_takeaway: 'Just added!' },
      'token',
    );
    expect(createResp.status).toBe('success');
    expect(createResp.data.mantra.title).toBe('Brand New');

    const response = await mantraService.getFeedMantras('token');
    expect(response.data.find((m) => m.title === 'Brand New')).toBeTruthy();
  });

  it('updates an existing mantra', async () => {
    const newTitle = 'Updated Title!!';
    const updateResp = await mantraService.updateMantra(1, { title: newTitle }, 'token');
    expect(updateResp.status).toBe('success');
    expect(updateResp.data.mantra.title).toBe(newTitle);

    const response = await mantraService.getFeedMantras('token');
    expect(response.data.find((m) => m.mantra_id === 1)?.title).toBe(newTitle);
  });

  it('fails to update mantra that does not exist', async () => {
    const updateResp = await mantraService.updateMantra(
      777,
      { title: 'Should Not Update' },
      'token',
    );
    expect(updateResp.status).toBe('error');
    expect(updateResp.message).toMatch(/not found/i);
    expect(updateResp.data.mantra).toBeNull();
  });

  it('deletes an existing mantra via the admin helper', async () => {
    const initialResponse = await mantraService.getFeedMantras('token');
    const targetId = initialResponse.data[0].mantra_id;

    const deleteResponse = await mantraService.deleteMantra(targetId, 'token');
    expect(deleteResponse.status).toBe('success');
    expect(deleteResponse.message).toMatch(/deleted/i);

    const updatedResponse = await mantraService.getFeedMantras('token');
    expect(updatedResponse.data.find((m) => m.mantra_id === targetId)).toBeUndefined();
  });

  it('returns error for deleting unknown mantra', async () => {
    const deleteResponse = await mantraService.deleteMantra(9999, 'token');
    expect(deleteResponse.status).toBe('error');
    expect(deleteResponse.message).toMatch(/not found/i);
  });

  it('returns empty feed after all mantras are deleted', async () => {
    // Remove all mantras
    for (const m of [...mockState.mantras]) {
      await mantraService.deleteMantra(m.mantra_id, 'token');
    }
    const response = await mantraService.getFeedMantras('token');
    expect(response.data.length).toBe(0);
  });

  it('mantra feed returns correct isLiked & isSaved after like/save actions', async () => {
    // Like mantra_id=2, save mantra_id=2
    await mantraService.likeMantra(2, 'token');
    await mantraService.saveMantra(2, 'token');
    const response = await mantraService.getFeedMantras('token');
    const m2 = response.data.find((m) => m.mantra_id === 2);
    expect(m2?.isLiked).toBe(true);
    expect(m2?.isSaved).toBe(true);
  });

  it('create, update, like, save, delete combined workflow', async () => {
    // Create
    const createResp = await mantraService.createMantra(
      { title: 'Workflow', key_takeaway: 'One workflow.' },
      'token',
    );
    const id = createResp.data.mantra.mantra_id;
    // Update
    await mantraService.updateMantra(id, { title: 'Workflow Updated' }, 'token');
    // Like & Save
    await mantraService.likeMantra(id, 'token');
    await mantraService.saveMantra(id, 'token');
    let response = await mantraService.getFeedMantras('token');
    const m = response.data.find((mm) => mm.mantra_id === id);
    expect(m?.title).toBe('Workflow Updated');
    expect(m?.isLiked).toBe(true);
    expect(m?.isSaved).toBe(true);
    // Delete
    const delResp = await mantraService.deleteMantra(id, 'token');
    expect(delResp.status).toBe('success');
  });

  describe('getMantraById', () => {
    it('returns a single mantra by ID', async () => {
      const response = await mantraService.getMantraById(1, 'token');
      expect(response.status).toBe('success');
      expect(response.data).toBeDefined();
      expect(response.data.mantra.mantra_id).toBe(1);
      expect(response.data.mantra.title).toBe('Pressure Is a Privilege');
    });

    it('returns mantra with correct isLiked/isSaved state', async () => {
      // Like and save mantra 2
      await mantraService.likeMantra(2, 'token');
      await mantraService.saveMantra(2, 'token');

      const response = await mantraService.getMantraById(2, 'token');
      expect(response.status).toBe('success');
      expect(response.data.mantra.isLiked).toBe(true);
      expect(response.data.mantra.isSaved).toBe(true);
    });

    it('returns error for non-existent mantra', async () => {
      const response = await mantraService.getMantraById(9999, 'token');
      expect(response.status).toBe('error');
      expect(response.message).toMatch(/not found/i);
    });
  });

  describe('getSavedMantras', () => {
    it('returns empty array when no mantras are saved', async () => {
      const savedMantras = await mantraService.getSavedMantras('token');
      expect(Array.isArray(savedMantras)).toBe(true);
      expect(savedMantras.length).toBe(0);
    });

    it('returns only saved mantras', async () => {
      // Save mantras 1 and 3
      await mantraService.saveMantra(1, 'token');
      await mantraService.saveMantra(3, 'token');

      const savedMantras = await mantraService.getSavedMantras('token');

      expect(savedMantras.length).toBe(2);
      expect(savedMantras.every((m: Mantra) => m.isSaved === true)).toBe(true);
      expect(savedMantras.find((m: Mantra) => m.mantra_id === 1)).toBeDefined();
      expect(savedMantras.find((m: Mantra) => m.mantra_id === 3)).toBeDefined();
      expect(savedMantras.find((m: Mantra) => m.mantra_id === 2)).toBeUndefined();
    });

    it('returns saved mantras with correct isLiked state', async () => {
      // Save and like mantra 2
      await mantraService.saveMantra(2, 'token');
      await mantraService.likeMantra(2, 'token');

      const savedMantras = await mantraService.getSavedMantras('token');

      expect(savedMantras.length).toBe(1);
      const mantra2 = savedMantras.find((m: Mantra) => m.mantra_id === 2);
      expect(mantra2?.isSaved).toBe(true);
      expect(mantra2?.isLiked).toBe(true);
    });

    it('updates when mantras are unsaved', async () => {
      // Save mantras 1 and 2
      await mantraService.saveMantra(1, 'token');
      await mantraService.saveMantra(2, 'token');

      let savedMantras = await mantraService.getSavedMantras('token');
      expect(savedMantras.length).toBe(2);

      // Unsave mantra 1
      await mantraService.unsaveMantra(1, 'token');

      savedMantras = await mantraService.getSavedMantras('token');
      expect(savedMantras.length).toBe(1);
      expect(savedMantras[0].mantra_id).toBe(2);
    });
  });
});
