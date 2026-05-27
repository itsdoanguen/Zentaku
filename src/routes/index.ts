import type { Router } from 'express';
import express from 'express';

/**
 * Initialize main application routes with dependency injection
 * @param {Object} container - DI container instance
 * @returns {Router} Express router with all configured routes
 */
const initializeRoutes = (container: unknown): Router => {
  const router = express.Router();

  const authRoutes = require('../modules/auth/auth.routes');
  const animeRoutes = require('../modules/anime/anime.routes');
  const readingMediaRoutes = require('../modules/reading-media/reading-media.routes');
  const streamingRoutes = require('../modules/streaming/streaming.routes');
  const searchRoutes = require('../modules/search/search.routes');

  const listRoutes = require('../modules/list/list.routes');
  const userRoutes = require('../modules/user/user.routes');
  const activityRoutes = require('../modules/activity/activity.routes');
  const followRoutes = require('../modules/follow/follow.routes');
  const communityRoutes = require('../modules/community/community.routes');
  const channelRoutes = require('../modules/channel/channel.routes');
  const messageRoutes = require('../modules/message/message.routes');

  router.use('/auth', authRoutes(container));
  router.use('/user', userRoutes(container));
  router.use('/communities', communityRoutes(container));

  router.use('/anilist/anime', animeRoutes(container));

  /**
   * @swagger
   * /api/anilist/staff/{id}:
   *   get:
   *     tags:
   *       - Staff
   *     summary: Get staff information
   *     description: Retrieve detailed information about a staff member from AniList API.
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: Staff details retrieved successfully
   *       400:
   *         description: Invalid ID
   *       404:
   *         description: Staff not found
   *       500:
   *         description: Server error
   */
  router.get(
    '/anilist/staff/:id',
    async (req: express.Request, res: express.Response, next: express.NextFunction) => {
      try {
        const staffId = parseInt(req.params.id, 10);
        if (isNaN(staffId)) {
          res.status(400).json({ success: false, errors: [{ message: 'Invalid staff ID' }] });
          return;
        }
        const staffClient = (container as any).resolve('anilistStaffClient');
        const data = await staffClient.fetchById(staffId);
        res.json({ success: true, data });
      } catch (error) {
        next(error);
      }
    }
  );

  router.use('/anilist', readingMediaRoutes(container));
  router.use('/streaming', streamingRoutes(container));

  /**
   * @swagger
   * /api/tasks/{taskId}:
   *   get:
   *     tags:
   *       - Streaming
   *     summary: Get upstream async task status
   *     description: Poll AniProvider task status through the Node bridge endpoint
   *     parameters:
   *       - in: path
   *         name: taskId
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Task status retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/StreamingTaskStatusResponse'
   *       400:
   *         $ref: '#/components/responses/ValidationError'
   *       500:
   *         $ref: '#/components/responses/ServerError'
   */

  const { validateGetTaskStatus } = require('../modules/streaming/streaming.validator');
  router.get(
    '/tasks/:taskId',
    validateGetTaskStatus,
    (container as any).resolve('streamingController').getTaskStatus
  );

  router.use('/search', searchRoutes(container));

  // Routes with global auth middlewares inside them mounted at '/'
  router.use('/', channelRoutes(container));
  router.use('/', messageRoutes(container));

  router.use('/', activityRoutes(container));
  router.use('/', followRoutes(container));
  router.use('/list', listRoutes(container));
  return router;
};

export = initializeRoutes;
