import { Router } from 'express';
import authRoutes from './auth.routes';
import mantraRoutes from './mantra.routes';
import categoryRoutes from './category.routes';
import collectionRoutes from './collection.routes';
import likeRoutes from './like.routes';
import reminderRoutes from './reminder.routes';
import recommendationRoutes from './recommendation.routes';
import userRoutes from './user.routes';
import chatRoutes from './chat.routes';
import notificationRoutes from './notification.routes';
import ratingRoutes from './rating.routes';
import journalRoutes from './journal.routes';
import algorithmRoutes from './algorithm.routes';

const router = Router();

// Auth routes
router.use('/auth', authRoutes);

// Mantra routes
router.use('/mantras', mantraRoutes);

// Category routes
router.use('/categories', categoryRoutes);

// Collection routes
router.use('/collections', collectionRoutes);

// Like routes
router.use('/likes', likeRoutes);

// Reminder routes
router.use('/reminders', reminderRoutes);

// Recommendation routes
router.use('/recommendations', recommendationRoutes);

// User routes
router.use('/users', userRoutes);

// Chat routes
router.use('/chat', chatRoutes);

// Notification routes
router.use('/notifications', notificationRoutes);
// Rating routes
router.use('/ratings', ratingRoutes); 

// Journal routes
router.use('/journal', journalRoutes);

// Algorithm routes (user category scores)
router.use('/algorithm', algorithmRoutes);

export default router;