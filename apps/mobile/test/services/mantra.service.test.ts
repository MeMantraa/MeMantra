/* global require */

let mantraService: typeof import('../../services/mantra.service').mantraService;

describe('mantraService (mock implementation)', () => {
  beforeEach(() => {
    jest.resetModules();
    ({ mantraService } = require('../../services/mantra.service'));
  });

  it('returns mock mantra data with success status', async () => {
    const response = await mantraService.getFeedMantras('token');
    expect(response.status).toBe('success');
    expect(response.data.length).toBeGreaterThan(0);
  });

  it('toggles liked state through like/unlike helpers', async () => {
    await mantraService.likeMantra(1, 'token');
    let response = await mantraService.getFeedMantras('token');
    const likedMantra = response.data.find((m) => m.mantra_id === 1);
    expect(likedMantra?.isLiked).toBe(true);

    await mantraService.unlikeMantra(1, 'token');
    response = await mantraService.getFeedMantras('token');
    const unlikedMantra = response.data.find((m) => m.mantra_id === 1);
    expect(unlikedMantra?.isLiked).toBe(false);
  });

  it('toggles saved state through save/unsave helpers', async () => {
    await mantraService.saveMantra(2, 'token');
    let response = await mantraService.getFeedMantras('token');
    const savedMantra = response.data.find((m) => m.mantra_id === 2);
    expect(savedMantra?.isSaved).toBe(true);

    await mantraService.unsaveMantra(2, 'token');
    response = await mantraService.getFeedMantras('token');
    const unsavedMantra = response.data.find((m) => m.mantra_id === 2);
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
    const created = response.data.find((m) => m.title === 'New Admin Mantra');
    expect(created).toBeTruthy();
    expect(created?.key_takeaway).toBe('A fresh description');
  });

  it('deletes an existing mantra via the admin helper', async () => {
    const initialResponse = await mantraService.getFeedMantras('token');
    const targetId = initialResponse.data[0].mantra_id;

    const deleteResponse = await mantraService.deleteMantra(targetId, 'token');
    expect(deleteResponse.status).toBe('success');

    const updatedResponse = await mantraService.getFeedMantras('token');
    expect(updatedResponse.data.find((m) => m.mantra_id === targetId)).toBeUndefined();
  });
});
