import { Router } from 'express';
import { ThemeController } from '../controllers/theme.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', ThemeController.getTheme);
router.put('/', ThemeController.updateTheme);

export default router;