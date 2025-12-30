const express = require('express');
const router = express.Router();
const animeRoutes = require('../modules/anime/anime.routes');

router.get('/status', (req, res) => {
    res.status(200).json({ message: 'Server is running OK!' });
});

router.use('/anilist/anime', animeRoutes);

module.exports = router;