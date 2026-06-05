/**
 * Notification Controller
 *
 * REST API endpoints for notification management.
 */

import type { Request, Response, NextFunction } from 'express';
import type { NotificationService } from '../services/notification.service';

export default class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  /**
   * GET /api/notifications
   * Get paginated notifications for the authenticated user.
   */
  getNotifications = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = Math.min(parseInt(req.query.limit as string, 10) || 20, 100);

      const result = await this.notificationService.getUserNotifications(
        BigInt(userId),
        page,
        limit
      );

      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/notifications/unread-count
   * Get unread notification count for the authenticated user.
   */
  getUnreadCount = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const count = await this.notificationService.getUnreadCount(BigInt(userId));

      res.json({ success: true, data: { unreadCount: count } });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PATCH /api/notifications/:id/read
   * Mark a single notification as read.
   */
  markAsRead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const notificationId = req.params.id;
      if (!notificationId) {
        res.status(400).json({ success: false, message: 'Notification ID is required' });
        return;
      }

      const updated = await this.notificationService.markAsRead(
        BigInt(notificationId),
        BigInt(userId)
      );

      if (!updated) {
        res.status(404).json({ success: false, message: 'Notification not found' });
        return;
      }

      res.json({ success: true, message: 'Notification marked as read' });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PATCH /api/notifications/read-all
   * Mark all notifications as read for the authenticated user.
   */
  markAllAsRead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const count = await this.notificationService.markAllAsRead(BigInt(userId));

      res.json({ success: true, data: { updatedCount: count } });
    } catch (error) {
      next(error);
    }
  };
}
