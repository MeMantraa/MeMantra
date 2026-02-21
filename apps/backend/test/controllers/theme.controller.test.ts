import { Request, Response } from 'express';
import { ThemeController } from '../../src/controllers/theme.controller';
import { UserModel } from '../../src/models/user.model';

jest.mock('../../src/models/user.model');

interface AuthRequest extends Request {
  user?: { userId: number; email: string };
}

describe('ThemeController', () => {
  let mockRequest: Partial<AuthRequest>;
  let mockResponse: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    
    mockRequest = {
      user: { userId: 1, email: 'test@example.com' },
      body: {},
    };
    
    mockResponse = {
      status: statusMock,
      json: jsonMock,
    };
  });

  describe('getTheme', () => {
    it('returns theme for authenticated user', async () => {
      (UserModel.getTheme as jest.Mock).mockResolvedValue('ocean');

      await ThemeController.getTheme(mockRequest as Request, mockResponse as Response);

      expect(UserModel.getTheme).toHaveBeenCalledWith(1);
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        status: 'success',
        data: { theme: 'ocean' },
      });
    });

    it('returns 401 when user not authenticated', async () => {
      mockRequest.user = undefined;

      await ThemeController.getTheme(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        status: 'error',
        message: 'Unauthorized',
      });
    });

    it('returns 500 on database error', async () => {
      (UserModel.getTheme as jest.Mock).mockRejectedValue(new Error('DB error'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await ThemeController.getTheme(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        status: 'error',
        message: 'Error retrieving theme',
      });
      
      consoleSpy.mockRestore();
    });
  });

  describe('updateTheme', () => {
    it('updates theme for authenticated user', async () => {
      mockRequest.body = { theme: 'ocean' };
      (UserModel.updateTheme as jest.Mock).mockResolvedValue({});

      await ThemeController.updateTheme(mockRequest as Request, mockResponse as Response);

      expect(UserModel.updateTheme).toHaveBeenCalledWith(1, 'ocean');
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        status: 'success',
        data: { theme: 'ocean' },
      });
    });

    it('returns 401 when user not authenticated', async () => {
      mockRequest.user = undefined;
      mockRequest.body = { theme: 'sunset' };

      await ThemeController.updateTheme(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        status: 'error',
        message: 'Unauthorized',
      });
    });

    it('returns 400 when theme not provided', async () => {
      mockRequest.body = {};

      await ThemeController.updateTheme(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        status: 'error',
        message: 'Theme is required',
      });
    });

    it('returns 400 when theme is invalid', async () => {
      mockRequest.body = { theme: 'invalid-theme' };

      await ThemeController.updateTheme(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        status: 'error',
        message: expect.stringContaining('Invalid theme'),
      });
      expect(UserModel.updateTheme).not.toHaveBeenCalled();
    });

    it('returns 500 on database error', async () => {
      mockRequest.body = { theme: 'forest' };
      (UserModel.updateTheme as jest.Mock).mockRejectedValue(new Error('DB error'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await ThemeController.updateTheme(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        status: 'error',
        message: 'Error updating theme',
      });
      
      consoleSpy.mockRestore();
    });
  });
});