import { Router } from 'express';
import authRoutes from './auth.routes';
import mantraRoutes from './mantra.routes';
import collectionRoutes from './collection.routes';
import likeRoutes from './like.routes';
import reminderRoutes from './reminder.routes';
import categoryRoutes from './category.routes';

const router = Router();

// Authentication routes
router.use('/auth', authRoutes);

// Mantra routes
router.use('/mantras', mantraRoutes);

// Collection routes
router.use('/collections', collectionRoutes);

// Like routes
router.use('/likes', likeRoutes);

// Reminder routes
router.use('/reminders', reminderRoutes);

// Category routes
router.use('/categories', categoryRoutes);

export default router;