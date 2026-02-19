import { Request, Response } from 'express';
import { UserModel } from '../models/user.model';

const VALID_THEMES = [
  'default',
  'ocean',
  'sunset',
  'forest',
  'lavender',
  'earth',
  'moonlight',
  'terracotta',
] as const;

export const ThemeController = {
  async getTheme(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          status: 'error',
          message: 'Unauthorized',
        });
      }

      const theme = await UserModel.getTheme(userId);

      return res.status(200).json({
        status: 'success',
        data: { theme },
      });
    } catch (error) {
      console.error('Get theme error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Error retrieving theme',
      });
    }
  },

  async updateTheme(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      const { theme } = req.body;

      if (!userId) {
        return res.status(401).json({
          status: 'error',
          message: 'Unauthorized',
        });
      }

      if (!theme) {
        return res.status(400).json({
          status: 'error',
          message: 'Theme is required',
        });
      }

      // Validate theme 
      if (!VALID_THEMES.includes(theme)) {
        return res.status(400).json({
          status: 'error',
          message: `Invalid theme. Allowed values: ${VALID_THEMES.join(', ')}`,
        });
      }

      await UserModel.updateTheme(userId, theme);

      return res.status(200).json({
        status: 'success',
        data: { theme },
      });
    } catch (error) {
      console.error('Update theme error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Error updating theme',
      });
    }
  },
};