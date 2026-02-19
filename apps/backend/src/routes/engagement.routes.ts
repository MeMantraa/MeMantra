import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { requireAdmin } from '../middleware/admin.middleware';
import { validateRequest } from '../middleware/validate.middleware';
import { trackEventSchema } from '../validators/engagement.validator';
import { EngagementController } from '../controllers/engagement.controller';

const router = Router();

router.use(authenticate);
router.get('/analytics', requireAdmin, EngagementController.getAnalytics);
router.post('/event', validateRequest(trackEventSchema), EngagementController.trackEvent);

export default router;
