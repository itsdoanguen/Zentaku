import type { Request, Response, Router } from 'express';
import express from 'express';

/**
 * Initialize main application routes with dependency injection
 * @param {Object} container - DI container instance
 * @returns {Router} Express router with all configured routes
 */
const initializeRoutes = (container: any): Router => {
  const router = express.Router();

  const animeRoutes = require('../modules/anime/anime.routes');

  router.get('/status', (_req: Request, res: Response) => {
    res.status(200).json({ message: 'Server is running OK!' });
  });

  router.use('/anilist/anime', animeRoutes(container));

  return router;
};

export = initializeRoutes;
