import express, { type Router } from 'express';
import type { Container } from '../../config/container';
import { authenticate } from '../../middlewares/authenticate';
import type ScheduleController from './schedule.controller';

const initializeScheduleRoutes = (container: Container): Router => {
  const router = express.Router();
  const scheduleController = container.resolve<ScheduleController>('scheduleController');

  /**
   * @swagger
   * /api/schedule:
   *   get:
   *     tags: [Schedule]
   *     summary: Get user personalized airing schedule
   *     description: Fetches calendar and up-next airing schedules for anime the user is currently watching.
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: start
   *         description: Unix timestamp for start of timeframe (Calendar)
   *         required: false
   *         schema:
   *           type: integer
   *       - in: query
   *         name: end
   *         description: Unix timestamp for end of timeframe (Calendar)
   *         required: false
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: Schedule retrieved successfully
   *       401:
   *         description: Unauthorized
   */
  router.get('/', authenticate, scheduleController.getSchedule);

  return router;
};

export = initializeScheduleRoutes;
