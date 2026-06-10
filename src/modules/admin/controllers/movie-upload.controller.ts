/**
 * Movie Upload Controller
 *
 * Handles HTTP requests for movie upload operations.
 */

import type { Request, Response } from 'express';
import type { MovieUploadService } from '../services/movie-upload.service';

export class MovieUploadController {
  constructor(private readonly movieUploadService: MovieUploadService) {
    this.uploadEpisode = this.uploadEpisode.bind(this);
    this.getEpisodes = this.getEpisodes.bind(this);
    this.getConversionStatus = this.getConversionStatus.bind(this);
    this.getMovies = this.getMovies.bind(this);
  }

  /**
   * POST /admin/movies/upload
   * Upload video and subtitle files for an anime episode
   *
   * Expected: multipart/form-data with fields:
   * - video: video file (.mp4, .mkv)
   * - subtitle: subtitle file (.vtt)
   * - animeId: AniList ID (number)
   * - episodeNumber: Episode number (number)
   */
  async uploadEpisode(req: Request, res: Response): Promise<void> {
    try {
      const { animeId, episodeNumber } = req.body;

      if (!animeId || !episodeNumber) {
        res.status(400).json({
          success: false,
          error: 'animeId and episodeNumber are required',
        });
        return;
      }

      const parsedAnimeId = parseInt(animeId, 10);
      const parsedEpisodeNumber = parseInt(episodeNumber, 10);

      if (isNaN(parsedAnimeId) || isNaN(parsedEpisodeNumber)) {
        res.status(400).json({
          success: false,
          error: 'animeId and episodeNumber must be valid numbers',
        });
        return;
      }

      if (parsedEpisodeNumber < 1 || parsedEpisodeNumber > 9999) {
        res.status(400).json({
          success: false,
          error: 'episodeNumber must be between 1 and 9999',
        });
        return;
      }

      // Extract file paths from multer
      const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
      const videoFile = files?.['video']?.[0];
      const subtitleFile = files?.['subtitle']?.[0];

      if (!videoFile && !subtitleFile) {
        res.status(400).json({
          success: false,
          error: 'At least one file (video or subtitle) is required',
        });
        return;
      }

      const result = await this.movieUploadService.uploadEpisode(
        parsedAnimeId,
        parsedEpisodeNumber,
        videoFile?.path || '',
        subtitleFile?.path
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to upload episode',
      });
    }
  }

  /**
   * GET /admin/movies/:animeId/episodes
   * Get list of episodes for an anime from FilmServer
   */
  async getEpisodes(req: Request, res: Response): Promise<void> {
    try {
      const animeId = parseInt(req.params.animeId || '', 10);
      if (isNaN(animeId)) {
        res.status(400).json({
          success: false,
          error: 'Valid animeId is required',
        });
        return;
      }

      const episodes = await this.movieUploadService.getEpisodes(animeId);
      res.json({
        success: true,
        data: episodes,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch episodes',
      });
    }
  }

  /**
   * GET /admin/movies/conversion-status
   * Get active conversion status from FilmServer
   */
  async getConversionStatus(_req: Request, res: Response): Promise<void> {
    try {
      const status = await this.movieUploadService.getConversionStatus();
      res.json({
        success: true,
        data: status,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get conversion status',
      });
    }
  }

  /**
   * GET /admin/movies
   * Get all movies from FilmServer
   */
  async getMovies(_req: Request, res: Response): Promise<void> {
    try {
      const movies = await this.movieUploadService.getMovies();
      res.json({
        success: true,
        data: movies,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch movies',
      });
    }
  }
}
