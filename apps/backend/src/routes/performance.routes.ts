import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { requireAdmin } from '../middleware/admin.middleware';
import { validateRequest } from '../middleware/validate.middleware';
import { trackPerformanceEventSchema } from '../validators/performance.validator';
import { PerformanceController } from '../controllers/performance.controller';

const router = Router();

router.post('/event', validateRequest(trackPerformanceEventSchema), PerformanceController.trackEvent);
router.get('/summary', authenticate, requireAdmin, PerformanceController.getSummary);

export default router;
