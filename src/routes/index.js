const express = require('express');

/**
 * Initialize main application routes with dependency injection
 * @param {Object} container - DI container instance
 * @returns {Router} Express router with all configured routes
 */
module.exports = (container) => {
  const router = express.Router();
  
  const animeRoutes = require('../modules/anime/anime.routes');

  router.get('/status', (req, res) => {
    res.status(200).json({ message: 'Server is running OK!' });
  });

  router.use('/anilist/anime', animeRoutes(container));

  return router;
};