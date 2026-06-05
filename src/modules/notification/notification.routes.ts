/**
 * Notification Routes
 *
 * REST API routes for notification management.
 */

import express, { type Router } from 'express';
import type { Container } from '../../config/container';
import { authenticate } from '../../middlewares/authenticate';
import type NotificationController from './controllers/notification.controller';

const initializeNotificationRoutes = (container: Container): Router => {
  const router = express.Router();
  const notificationController =
    container.resolve<NotificationController>('notificationController');

  /**
   * @swagger
   * /api/notifications:
   *   get:
   *     tags: [Notifications]
   *     summary: Get user notifications
   *     description: Get paginated list of notifications for the authenticated user.
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           default: 1
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 20
   *           maximum: 100
   *     responses:
   *       200:
   *         description: Notifications retrieved successfully
   *       401:
   *         description: Unauthorized
   */
  router.get('/', authenticate, notificationController.getNotifications);

  /**
   * @swagger
   * /api/notifications/unread-count:
   *   get:
   *     tags: [Notifications]
   *     summary: Get unread notification count
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Unread count retrieved successfully
   *       401:
   *         description: Unauthorized
   */
  router.get('/unread-count', authenticate, notificationController.getUnreadCount);

  /**
   * @swagger
   * /api/notifications/read-all:
   *   patch:
   *     tags: [Notifications]
   *     summary: Mark all notifications as read
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: All notifications marked as read
   *       401:
   *         description: Unauthorized
   */
  router.patch('/read-all', authenticate, notificationController.markAllAsRead);

  /**
   * @swagger
   * /api/notifications/{id}/read:
   *   patch:
   *     tags: [Notifications]
   *     summary: Mark a notification as read
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Notification marked as read
   *       401:
   *         description: Unauthorized
   *       404:
   *         description: Notification not found
   */
  router.patch('/:id/read', authenticate, notificationController.markAsRead);

  return router;
};

export = initializeNotificationRoutes;
