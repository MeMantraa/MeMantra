import request from 'supertest';
import express from 'express';
import { UserController } from '../../src/controllers/user.controller';
import { UserModel } from '../../src/models/user.model';

jest.mock('../../src/models/user.model');

const app = express();
app.use(express.json({ limit: '10mb' }));

app.use((req, _res, next) => {
  (req as any).user = { userId: 1, email: 'test@example.com' };
  next();
});

app.put('/api/profile/photo', UserController.updateProfilePhoto);

describe('ProfileController - updateProfilePhoto', () => {
  const validBase64Photo = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAA8A';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should update profile photo successfully', async () => {
    (UserModel.updateProfilePhoto as jest.Mock).mockResolvedValue({
      user_id: 1,
      username: 'testuser',
      email: 'test@example.com',
      auth_provider: 'local',
      created_at: '2024-01-01',
      profile_photo: validBase64Photo,
    });

    const res = await request(app)
      .put('/api/profile/photo')
      .send({ photo: validBase64Photo });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.message).toBe('Profile photo updated successfully');
    expect(res.body.data.user.profile_photo).toBe(validBase64Photo);
  });

  it('should accept png format', async () => {
    const pngPhoto = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    
    (UserModel.updateProfilePhoto as jest.Mock).mockResolvedValue({
      user_id: 1,
      username: 'testuser',
      email: 'test@example.com',
      profile_photo: pngPhoto,
    });

    const res = await request(app)
      .put('/api/profile/photo')
      .send({ photo: pngPhoto });

    expect(res.status).toBe(200);
  });

  it('should accept webp format', async () => {
    const webpPhoto = 'data:image/webp;base64,UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoBAAEAAwA0JaQAA3AA/vuUAAA=';
    
    (UserModel.updateProfilePhoto as jest.Mock).mockResolvedValue({
      user_id: 1,
      username: 'testuser',
      profile_photo: webpPhoto,
    });

    const res = await request(app)
      .put('/api/profile/photo')
      .send({ photo: webpPhoto });

    expect(res.status).toBe(200);
  });

  it('should return 401 if user not authenticated', async () => {
    const appNoAuth = express();
    appNoAuth.use(express.json());
    appNoAuth.put('/api/profile/photo', UserController.updateProfilePhoto);

    const res = await request(appNoAuth)
      .put('/api/profile/photo')
      .send({ photo: validBase64Photo });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Unauthorized');
  });

  it('should return 400 if photo is missing', async () => {
    const res = await request(app)
      .put('/api/profile/photo')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Photo data is required');
  });

  it('should return 400 if photo is not a string', async () => {
    const res = await request(app)
      .put('/api/profile/photo')
      .send({ photo: 12345 });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Photo data is required');
  });

  it('should return 400 for invalid photo format', async () => {
    const res = await request(app)
      .put('/api/profile/photo')
      .send({ photo: 'not-a-valid-base64-image' });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('Invalid photo format');
  });

  it('should return 400 for unsupported image format', async () => {
    const gifPhoto = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

    const res = await request(app)
      .put('/api/profile/photo')
      .send({ photo: gifPhoto });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('Invalid photo format');
  });

  it('should return 400 if photo exceeds 5MB', async () => {
    const largeBase64 = 'data:image/jpeg;base64,' + 'A'.repeat(7 * 1024 * 1024);

    const res = await request(app)
      .put('/api/profile/photo')
      .send({ photo: largeBase64 });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Photo size must be less than 5MB');
  });

  it('should return 404 if user not found', async () => {
    (UserModel.updateProfilePhoto as jest.Mock).mockResolvedValue(undefined);

    const res = await request(app)
      .put('/api/profile/photo')
      .send({ photo: validBase64Photo });

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('User not found');
  });

  it('should handle database errors', async () => {
    (UserModel.updateProfilePhoto as jest.Mock).mockRejectedValue(new Error('DB error'));

    const res = await request(app)
      .put('/api/profile/photo')
      .send({ photo: validBase64Photo });

    expect(res.status).toBe(500);
    expect(res.body.message).toBe('Error updating profile photo');
  });

  it('should allow updating photo multiple times', async () => {
    const photo1 = 'data:image/jpeg;base64,ABC123';
    const photo2 = 'data:image/png;base64,XYZ789';

    (UserModel.updateProfilePhoto as jest.Mock)
      .mockResolvedValueOnce({
        user_id: 1,
        username: 'testuser',
        profile_photo: photo1,
      })
      .mockResolvedValueOnce({
        user_id: 1,
        username: 'testuser',
        profile_photo: photo2,
      });

    const res1 = await request(app).put('/api/profile/photo').send({ photo: photo1 });
    expect(res1.status).toBe(200);

    const res2 = await request(app).put('/api/profile/photo').send({ photo: photo2 });
    expect(res2.status).toBe(200);
    expect(res2.body.data.user.profile_photo).toBe(photo2);
  });
});
