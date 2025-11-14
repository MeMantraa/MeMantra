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
});
