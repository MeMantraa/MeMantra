import { Router } from 'express';
import {
  MessageReportController,
  UserBlockController,
} from '../controllers/messageReport.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Message Report routes
router.post('/message', MessageReportController.reportMessage);
router.get('/message', MessageReportController.getAllReports);
router.get('/message/:id', MessageReportController.getReportById);
router.put('/message/:id', MessageReportController.updateReportStatus);
router.delete('/message/:id', MessageReportController.deleteReport);

// User Block routes
router.post('/block/:userId', UserBlockController.blockUser);
router.delete('/block/:userId', UserBlockController.unblockUser);
router.get('/blocked', UserBlockController.getBlockedUsers);
router.get('/is-blocked/:userId', UserBlockController.isBlocked);

export default router;
