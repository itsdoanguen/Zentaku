import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate';
import { requireSuperAdmin } from '../../middlewares/require-super-admin';
import { movieUpload } from '../../middlewares/upload';
import { AdminController } from './controllers/admin.controller';
import { MovieUploadController } from './controllers/movie-upload.controller';
import { AdminService } from './services/admin.service';
import { MovieUploadService } from './services/movie-upload.service';

export default (): Router => {
  const router = Router();
  const adminService = new AdminService();
  const adminController = new AdminController(adminService);
  const movieUploadService = new MovieUploadService();
  const movieUploadController = new MovieUploadController(movieUploadService);

  router.use(authenticate);
  router.use(requireSuperAdmin);

  /**
   * @swagger
   * /admin/health:
   *   get:
   *     tags: [Admin]
   *     summary: Get system health metrics
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: System health data
   */
  router.get('/health', adminController.getHealth);

  // ==================== Movie Upload Routes ====================

  /**
   * @swagger
   * /admin/movies:
   *   get:
   *     tags: [Admin - Movies]
   *     summary: Get all movies from FilmServer
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: List of movies with episode counts
   */
  router.get('/movies', movieUploadController.getMovies);

  /**
   * @swagger
   * /admin/movies/conversion-status:
   *   get:
   *     tags: [Admin - Movies]
   *     summary: Get active conversion status
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Active conversion jobs
   */
  router.get('/movies/conversion-status', movieUploadController.getConversionStatus);

  /**
   * @swagger
   * /admin/movies/{animeId}/episodes:
   *   get:
   *     tags: [Admin - Movies]
   *     summary: Get episodes for an anime from FilmServer
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: animeId
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: List of episodes
   */
  router.get(
    '/movies/:animeId/episodes',
    movieUploadController.getEpisodes.bind(movieUploadController)
  );

  /**
   * @swagger
   * /admin/movies/{animeId}:
   *   delete:
   *     tags: [Admin - Movies]
   *     summary: Delete an ENTIRE anime completely from FilmServer
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: animeId
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: Entire anime deleted successfully
   */
  router.delete('/movies/:animeId', movieUploadController.deleteAnime.bind(movieUploadController));

  /**
   * @swagger
   * /admin/movies/{animeId}/{episodeNumber}:
   *   delete:
   *     tags: [Admin - Movies]
   *     summary: Delete an episode completely from FilmServer
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: animeId
   *         required: true
   *         schema:
   *           type: integer
   *       - in: path
   *         name: episodeNumber
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: Episode deleted successfully
   */
  router.delete(
    '/movies/:animeId/:episodeNumber',
    movieUploadController.deleteEpisode.bind(movieUploadController)
  );

  /**
   * @swagger
   * /admin/movies/upload:
   *   post:
   *     tags: [Admin - Movies]
   *     summary: Upload video and subtitle for an episode
   *     security:
   *       - bearerAuth: []
   *     consumes:
   *       - multipart/form-data
   *     parameters:
   *       - in: formData
   *         name: video
   *         type: file
   *         description: Video file (.mp4, .mkv, .webm)
   *       - in: formData
   *         name: subtitle
   *         type: file
   *         description: Subtitle file (.vtt)
   *       - in: formData
   *         name: animeId
   *         type: integer
   *         required: true
   *       - in: formData
   *         name: episodeNumber
   *         type: integer
   *         required: true
   *     responses:
   *       200:
   *         description: Upload result with conversion status
   */
  router.post(
    '/movies/upload',
    movieUpload.fields([
      { name: 'video', maxCount: 1 },
      { name: 'subtitle', maxCount: 1 },
    ]),
    movieUploadController.uploadEpisode
  );

  return router;
};
