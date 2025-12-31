const express = require('express');
const router = express.Router();
const animeRoutes = require('../modules/anime/anime.routes');

/**
 * @swagger
 * /api/status:
 *   get:
 *     summary: Check API health status
 *     description: Returns a simple message to confirm the API is running
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Server is running successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Server is running OK!
 */
router.get('/status', (req, res) => {
    res.status(200).json({ message: 'Server is running OK!' });
});

router.use('/anilist/anime', animeRoutes);

module.exports = router;